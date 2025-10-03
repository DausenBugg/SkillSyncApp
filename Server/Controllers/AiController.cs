// Server/Controllers/AiController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Server.Controllers
{
    public record ResumeAnalysisRequest(string ResumeText);
    public record JobMatchResult(string Title, string Company, string Url, double MatchScore);
    public record ResumeImprovement(string Suggestion, string ResourceUrl);

    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly ILogger<AiController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _openAiApiKey;

        public AiController(ILogger<AiController> logger, IHttpClientFactory httpClientFactory, OpenAiOptions openAiOptions)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _openAiApiKey = openAiOptions.ApiKey ?? "";
        }

        // This endpoint takes a resume and returns job matches, analysis, improvements, and resources.
        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeResume([FromBody] ResumeAnalysisRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ResumeText))
                return BadRequest(new { error = "Resume text cannot be empty." });

            try
            {
                var jobs = await FetchJobMatches(request.ResumeText);
                var analysis = await AnalyzeJobRelevance(request.ResumeText, jobs);
                var improvements = await SuggestResumeImprovements(request.ResumeText);
                var resources = GetImprovementResources(improvements);

                return Ok(new
                {
                    jobs,
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

        // Gets jobs that match the resume (mocked for now)
        private async Task<List<JobMatchResult>> FetchJobMatches(string resume)
        {
            return new List<JobMatchResult>
        {
            new JobMatchResult("Software Engineer", "TechCorp", "https://indeed.com/job/123", 0.85),
            new JobMatchResult("Backend Developer", "WebWorks", "https://linkedin.com/job/456", 0.78)
        };
        }

        // Uses OpenAI to see how related the jobs are to the resume
        private async Task<string> AnalyzeJobRelevance(string resume, List<JobMatchResult> jobs)
        {
            var jobTitles = string.Join(", ", jobs.Select(j => j.Title));
            var prompt = $"Given this resume:\n{resume}\n\nAnd these jobs: {jobTitles}\n\nHow related are they?";
            return await CallOpenAi(prompt);
        }

        // Uses OpenAI to suggest improvements for the resume
        private async Task<List<ResumeImprovement>> SuggestResumeImprovements(string resume)
        {
            var prompt = $"Read this resume:\n{resume}\n\nWhat are 3 things that could be improved? Give a short suggestion and a resource link for each.";
            var response = await CallOpenAi(prompt);
            // For now, just return the whole response as one suggestion
            return new List<ResumeImprovement>
        {
            new ResumeImprovement(response, "https://www.coursera.org/courses?query=resume")
        };
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