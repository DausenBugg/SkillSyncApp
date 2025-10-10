// Server/Controllers/AiController.cs
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

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
                var (matchingSkills, missingSkills) = await CompareSkillsWithOpenAi(resumeSkills, jobSkills);
                double matchScore = jobSkills.Count == 0 ? 0 : (double)matchingSkills.Count / jobSkills.Count;


                // 3. Get AI feedback
                var analysis = await AnalyzeJobRelevance(request.ResumeText, request.JobDescription);

                // 4. Suggest improvements
                var improvements = await SuggestResumeImprovements(request.ResumeText);
                var resources = GetImprovementResources(improvements);

                return Ok(new
                {
                    matchScore,
                    matchingSkills,
                    missingSkills,
                    analysis,
                    improvements,
                    resources
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing resume");
                return StatusCode(500, new { error = "Server error. Please try again later." });
            }
        }

        // This method uses OpenAI to compare two lists of skills and returns which are matching and which are missing.
        private async Task<(List<string> matching, List<string> missing)> CompareSkillsWithOpenAi(List<string> resumeSkills, List<string> jobSkills)
        {
            // Build a prompt for OpenAI
            var prompt = $@"
            Given these two lists:
            Resume skills: {JsonSerializer.Serialize(resumeSkills)}
            Job requirements: {JsonSerializer.Serialize(jobSkills)}

            Which job requirement skills are present in the resume (even if the names are not exactly the same)? 
            Reply with a JSON object like:
            {{ 
              ""matching"": [ ...list of matching job skills... ], 
              ""missing"": [ ...list of missing job skills... ] 
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
                return (matching, missing);
            }
            catch
            {
                // Fallback: return empty lists if parsing fails
                return (new List<string>(), jobSkills);
            }
        }

        // Helper: Uses OpenAI to give feedback on how well the resume matches the job
        private async Task<string> AnalyzeJobRelevance(string resume, string jobDescription)
        {
            var prompt = $@"Given this resume: {resume}

            And this job description:
            {jobDescription}

            How well does the resume match the job? Give a short explanation.";

            return await CallOpenAi(prompt);
        }

        // Uses OpenAI to suggest improvements for the resume  
        private async Task<List<ResumeImprovement>> SuggestResumeImprovements(string resume)
        {
            // Ask OpenAI for 3 improvement suggestions as a JSON array of strings
            var prompt = $@"Read this resume: {resume}
            What are 4 things that could be improved? Reply with a JSON array of short suggestions only. Make it look like this [
              ""Learn advanced SQL"",
              ""Improve communication skills"",
              ""Get certified in project management""
            ]";

            var response = await CallOpenAi(prompt);

            List<string> suggestions;
            try
            {
                suggestions = JsonSerializer.Deserialize<List<string>>(response ?? "[]") ?? new List<string>();
            }
            catch
            {
                // If parsing fails, just use the whole response as one suggestion
                suggestions = new List<string> { response ?? "No suggestions." };
            }

            // For each suggestion, provide the Coursera link and the search term
            return suggestions.Select(s =>
                new ResumeImprovement(
                    s,
                    "https://www.coursera.org/",
                    s // search term
                )
            ).ToList();
        }

        // Helper: Extracts a list of skills from text using OpenAI
        private async Task<List<string>> ExtractSkillsFromText(string text)
        {
            var prompt = $@"Extract a list of skills from the following text. Reply with a JSON array of skill names only. {text}";
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
                max_tokens = 200,
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