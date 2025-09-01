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
    public record AiAnalysisRequest(string TextToAnalyze);

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

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeText([FromBody] AiAnalysisRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TextToAnalyze))
            {
                return BadRequest(new { error = "The text to analyze cannot be empty." });
            }

            // Build a short prompt for the model
            var prompt = $@"Awnser me back.
---
{request.TextToAnalyze}
---";

            // If API key is not configured, use local fallback
            if (string.IsNullOrWhiteSpace(_openAiApiKey))
            {
                _logger.LogWarning("OPENAI_API_KEY not configured; using local analysis fallback.");
                var fallback = LocalAnalysis(request.TextToAnalyze);
                // Return the message exactly as produced by the (local) analyzer
                return Ok(new { message = fallback, source = "local-fallback" });
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiApiKey);

                var reqObj = new
                {
                    model = "gpt-3.5-turbo",
                    messages = new[] { new { role = "user", content = prompt } },
                    max_tokens = 150,
                    temperature = 0.2
                };

                var reqJson = JsonSerializer.Serialize(reqObj);
                using var content = new StringContent(reqJson, Encoding.UTF8, "application/json");
                using var resp = await client.PostAsync("https://api.openai.com/v1/chat/completions", content);

                if (!resp.IsSuccessStatusCode)
                {
                    var errBody = await resp.Content.ReadAsStringAsync();
                    _logger.LogError("OpenAI API returned {Status}: {Body}", resp.StatusCode, errBody);
                    var fallback = LocalAnalysis(request.TextToAnalyze);
                    // Return the local fallback message
                    return Ok(new { message = fallback, source = "local-fallback", warning = "OpenAI error, used fallback." });
                }

                var respBody = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(respBody);
                var root = doc.RootElement;

                // Safely extract choices[0].message.content
                string aiText = null;
                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentEl))
                    {
                        aiText = contentEl.GetString();
                    }
                }

                if (string.IsNullOrWhiteSpace(aiText))
                {
                    _logger.LogWarning("OpenAI returned empty response; using local fallback.");
                    var fallback = LocalAnalysis(request.TextToAnalyze);
                    return Ok(new { message = fallback, source = "local-fallback", warning = "OpenAI returned empty response." });
                }

                aiText = aiText.Trim();
                // Return the exact message the AI gave in the "message" field
                return Ok(new { message = aiText, source = "openai" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while calling OpenAI; falling back to local analysis.");
                var fallback = LocalAnalysis(request.TextToAnalyze);
                return Ok(new { message = fallback, source = "local-fallback", warning = "OpenAI exception, used fallback." });
            }
        }

        private string LocalAnalysis(string text)
        {
            var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "the","and","a","an","to","of","in","on","for","with","is","are","was","were","by","as","that","this","it","be","or","from","at","which"
            };

            var tokens = text
                .Split(new char[] { ' ', '\t', '\r', '\n', ',', '.', ';', ':', '(', ')', '[', ']', '{', '}', '/', '\\', '|', '-', '_' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim().TrimEnd('.', ',', ';', ':', ')', ']'))
                .Where(t => t.Length > 2 && !stopWords.Contains(t))
                .Select(t => t.ToLowerInvariant());

            var topWords = tokens
                .GroupBy(t => t)
                .OrderByDescending(g => g.Count())
                .Take(8)
                .Select(g => g.Key)
                .ToList();

            if (topWords.Count == 0)
            {
                return "No clear skills or keywords were found in the provided text.";
            }

            return string.Join(", ", topWords);
        }
    }
}