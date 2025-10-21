// Server/Controllers/AiController.cs
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Server.Controllers
{
    // Add jobDescription to the request record
    public record ResumeAnalysisRequest(string ResumeText, string? JobDescription = null);
    public record ResumeImprovement(string Suggestion, string ResourceUrl, string SearchTerm);

    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly ILogger<AiController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _openAiApiKey;

        // Constructor with DI for logger, HTTP client factory, and OpenAI options
        public AiController(ILogger<AiController> logger, IHttpClientFactory httpClientFactory, OpenAiOptions openAiOptions)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _openAiApiKey = openAiOptions.ApiKey ?? "";
        }

        //<summary>
        //Analyzes a resume and returns job matches, analysis, improvement suggestions, and resources.
        //</summary>
        //<param name="request">The resume analysis request containing the resume text.</param>
        //<returns>
        //200 OK with analysis results, or 400 BadRequest if resume text is empty, or 500 Server Error on failure.
        //</returns>

        // This endpoint takes a resume and returns job matches, analysis, improvements, and resources.
        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeResume([FromBody] ResumeAnalysisRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ResumeText) || string.IsNullOrWhiteSpace(request.JobDescription))
                return BadRequest(new { error = "Resume and job description cannot be empty." });

            try
            {
                // 1. Extract skills from resume and job description using OpenAI
                var resumeSkills = await ExtractSkillsFromText(request.ResumeText);
                var jobSkills = await ExtractSkillsFromText(request.JobDescription);

                // 2. Compare skills
                var (matchingSkills, missingSkills, jobTitle) = await CompareSkillsWithOpenAi(resumeSkills, jobSkills);
                double matchScore = jobSkills.Count == 0 ? 0 : (double)matchingSkills.Count / jobSkills.Count;


                // 3. Get AI feedback
                var analysis = await AnalyzeJobRelevance(request.ResumeText, request.JobDescription, matchingSkills, missingSkills);

                // 4. Suggest improvements
                var improvements = await SuggestResumeImprovements(request.ResumeText, request.JobDescription);
                var resources = GetImprovementResources(improvements);

                return Ok(new
                {
                    matchScore,
                    matchingSkills,
                    missingSkills,
                    analysis,
                    improvements,
                    resources,
                    jobTitle
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing resume");
                return StatusCode(500, new { error = "Server error. Please try again later." });
            }
        }

        // This method uses OpenAI to compare two lists of skills and returns which are matching and which are missing.
        private async Task<(List<string> matching, List<string> missing, string jobTitle)> CompareSkillsWithOpenAi(List<string> resumeSkills, List<string> jobSkills)
        {
            // Build a prompt for OpenAI
            var prompt = $@"
            Given these two lists:
            Resume skills: {JsonSerializer.Serialize(resumeSkills)}
            Job requirements: {JsonSerializer.Serialize(jobSkills)}

            - For each job requirement skill, check if it is present in the resume skills, even if the names are not exactly the same (e.g., synonyms, similar job titles, or related terms).
            - Don't just check the resume skills section; consider all parts of the resume.
            - Look through every word in the resume to find implied skills.
            - Normalize skill names for comparison (e.g., 'Software Developer' and 'Software Engineer' are the same).
            - List which job requirement skills are matched (present in the resume, directly or as a synonym) and which are missing (not present or not implied).
            - Also, extract the most likely job title from the job requirements.
            - Keep your answer concise and to the point.
            - Make sure to reply in valid JSON format.
            - The skills may not be stated out right, so use your best judgment to identify implied skills from sentences.
            - Ignore physical capability skills.

            Reply with a JSON object like:
            {{ 
                ""matching"": [ Skill1, Skill2, Skill3, etc. ],  
                ""missing"": [ Skill1, Skill2, etc. ],
                ""jobTitle"": ""Put the job description job title here""
            }}
            ";

            var response = await CallOpenAi(prompt);

            // Try to parse the response
            try
            {
                using var doc = JsonDocument.Parse(response ?? "{}");
                var root = doc.RootElement;
                var matching = root.TryGetProperty("matching", out var m) && m.ValueKind == JsonValueKind.Array
                    ? m.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrWhiteSpace(x)).ToList()
                    : new List<string>();
                var missing = root.TryGetProperty("missing", out var ms) && ms.ValueKind == JsonValueKind.Array
                    ? ms.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrWhiteSpace(x)).ToList()
                    : new List<string>();
                var jobTitle = root.TryGetProperty("jobTitle", out var jt) && jt.ValueKind == JsonValueKind.String
                    ? jt.GetString() ?? ""
                    : "";
                return (matching, missing, jobTitle);
            }
            catch
            {
                // Fallback: return empty lists if parsing fails
                return (new List<string>(), jobSkills, "");
            }
        }

        // Helper: Uses OpenAI to give feedback on how well the resume matches the job
        private async Task<string> AnalyzeJobRelevance(string resume, string jobDescription, List<string> matchingSkills, List<string> missingSkills)
        {
            var prompt = $@"
            Given this resume:
            {resume}

            And this job description:
            {jobDescription}

            The resume has these matching skills: {string.Join(", ", matchingSkills)}
            The resume is missing these skills: {string.Join(", ", missingSkills)}

            How well does the resume match the job? 
            - Be honest and critical. 
            - If the resume does not match the job well, clearly explain why and point out the gaps or missing skills.
            - If the match is poor, do not be overly positive.
            - If the match is strong, explain why.
            - Keep your answer short and direct.";

            return await CallOpenAi(prompt);
        }

        // Uses OpenAI to suggest improvements for the resume  
        private async Task<List<ResumeImprovement>> SuggestResumeImprovements(string resume, string jobDescription)
        {
            // Prompt OpenAI to return a JSON array of objects with "suggestion" and "topic"
            var prompt = $@"
            Read this resume:
            {resume}

            And compare it to this job description:
            {jobDescription}

            What are 4 things that could be improved? 
            Reply with a JSON array of objects, each containing:
            - ""suggestion"": A short description of the improvement.
            - ""topic"": A single word or short phrase summarizing the topic of the improvement (for use as a search term).

            Example:
            [
              {{ ""suggestion"": ""Learn advanced SQL techniques."", ""topic"": ""SQL"" }},
              {{ ""suggestion"": ""Improve public speaking skills."", ""topic"": ""Public Speaking"" }},
              {{ ""suggestion"": ""Get certified in project management."", ""topic"": ""Project Management"" }},
              {{ ""suggestion"": ""Develop leadership abilities."", ""topic"": ""Leadership"" }}
            ]
            ";

            var response = await CallOpenAi(prompt);

            List<ResumeImprovement> improvements;
            try
            {
                // Parse the response as a list of objects with "suggestion" and "topic"
                var suggestions = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(response ?? "[]") ?? new List<Dictionary<string, string>>();
                improvements = suggestions.Select(s =>
                    new ResumeImprovement(
                        s.GetValueOrDefault("suggestion", "No suggestion provided."),
                        "https://www.coursera.org/",
                        s.GetValueOrDefault("topic", "General") // Use topic as the search term
                    )
                ).ToList();
            }
            catch
            {
                // If parsing fails, return a default improvement
                improvements = new List<ResumeImprovement>
        {
            new ResumeImprovement("No suggestions available.", "https://www.coursera.org/", "General")
        };
            }

            return improvements;
        }

        // Helper: Extracts a list of skills from text using OpenAI
        private async Task<List<string>> ExtractSkillsFromText(string text)
        {
            var prompt = $@"
            Extract a list of professional skills, job titles, and technical abilities from the following text. 
            - Normalize skill names (e.g., 'Software Developer', 'Software Engineer', and 'Programmer' should be considered the same skill: 'Software Engineer').
            - Include both explicit and implied skills, even if phrased differently or as synonyms.
            - Reply with a JSON array of unique, normalized skill names only.
            - Don't include any extra text outside the json format.
            - Make sure to enclose the entire skill list inside [].
            {text}";

            var response = await CallOpenAi(prompt);
            try
            {
                return JsonSerializer.Deserialize<List<string>>(response ?? "[]") ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }

        // Gets resource links from the improvements
        private List<string> GetImprovementResources(List<ResumeImprovement> improvements)
        {
            return improvements.Select(i => i.ResourceUrl).ToList();
        }

        // Calls OpenAI API
        private async Task<string> CallOpenAi(string prompt)
        {
            var client = _httpClientFactory.CreateClient("OpenAI");
            var reqObj = new
            {
                model = "gpt-3.5-turbo",
                messages = new[] { new { role = "user", content = prompt } },
                max_tokens = 400,
                temperature = 0.3
            };
            var reqJson = JsonSerializer.Serialize(reqObj);
            using var content = new StringContent(reqJson, Encoding.UTF8, "application/json");
            using var resp = await client.PostAsync("chat/completions", content);
            var respBody = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(respBody);
            var root = doc.RootElement;
            string aiText = null;
            if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
            {
                var first = choices[0];
                if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentEl))
                {
                    aiText = contentEl.GetString();
                }
            }
            return aiText?.Trim() ?? "No response.";
        }
    }
}