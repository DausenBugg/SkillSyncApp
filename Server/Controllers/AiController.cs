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

        public AiController(ILogger<AiController> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            // Expect the OpenAI API key in environment variable OPENAI_API_KEY (or set here from configuration)
            _openAiApiKey = "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";
        }

        // This controller takes a resume, finds jobs, checks how related they are, suggests improvements, and gives resources
        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeResume([FromBody] ResumeAnalysisRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ResumeText))
                return BadRequest(new { error = "Resume text cannot be empty." });

            // 1. Get job matches
            var jobs = await FetchJobMatches(request.ResumeText);

            // 2. Analyze relevance
            var analysis = await AnalyzeJobRelevance(request.ResumeText, jobs);

            // 3. Suggest improvements
            var improvements = await SuggestResumeImprovements(request.ResumeText);

            // 4. Provide resources
            var resources = await GetImprovementResources(improvements);

            return Ok(new
            {
                jobs,
                analysis,
                improvements,
                resources
            });
        }

        // These methods use OpenAI to check how related the jobs are, suggest improvements, and give resource links

        // This method would get jobs from job sites. For now, it just returns fake jobs
        private async Task<List<JobMatchResult>> FetchJobMatches(string resume)
        {
            // In a real app, call Indeed/LinkedIn APIs here.
            // For now, return sample jobs.
            return new List<JobMatchResult>
            {
                new JobMatchResult("Software Engineer", "TechCorp", "https://indeed.com/job/123", 0.85),
                new JobMatchResult("Backend Developer", "WebWorks", "https://linkedin.com/job/456", 0.78)
            };
        }

        private async Task<string> AnalyzeJobRelevance(string resume, List<JobMatchResult> jobs)
        {
            // Build a prompt for OpenAI
            var jobTitles = string.Join(", ", jobs.Select(j => j.Title));
            var prompt = $"Given this resume:\n{resume}\n\nAnd these jobs: {jobTitles}\n\nHow related are they?";

            var response = await CallOpenAi(prompt);
            return response;
        }

        private async Task<List<ResumeImprovement>> SuggestResumeImprovements(string resume)
        {
            var prompt = $"Read this resume:\n{resume}\n\nWhat are 3 things that could be improved? Give a short suggestion and a resource link for each.";
            var response = await CallOpenAi(prompt);

            // Parse response (for now, just return as a single suggestion)
            return new List<ResumeImprovement>
            {
                new ResumeImprovement(response, "https://www.coursera.org/courses?query=resume")
            };
        }

        private async Task<List<string>> GetImprovementResources(List<ResumeImprovement> improvements)
        {
            // Just return the resource URLs from improvements
            return improvements.Select(i => i.ResourceUrl).ToList();
        }

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