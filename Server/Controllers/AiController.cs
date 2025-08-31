// Server/Controllers/AiController.cs
using Microsoft.AspNetCore.Mvc;
using OpenAI-dotnet; // Required for IOpenAIService
using OpenAI.ObjectModels.RequestModels; // Required for ChatCompletionCreateRequest

public record AiPromptRequest(string Prompt);

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IOpenAIService _openAiService;

    // The IOpenAIService is now automatically "injected" by .NET
    public AiController(IOpenAIService openAiService)
    {
        _openAiService = openAiService;
    }

    [HttpPost("analyze-text")]
    public async Task<IActionResult> AnalyzeText([FromBody] AiPromptRequest request)
    {
        if (string.IsNullOrEmpty(request.Prompt))
        {
            return BadRequest("Prompt cannot be empty.");
        }

        try
        {
            // 1. Create the API request object
            var chatRequest = new ChatCompletionCreateRequest
            {
                // Define the messages for the chat
                Messages = new List<ChatMessage>
                {
                    // Provide the system's role and instructions
                    ChatMessage.FromSystem("You are a helpful career assistant. Analyze the following text and provide a concise, one-paragraph summary."),
                    // Provide the user's actual prompt
                    ChatMessage.FromUser(request.Prompt)
                },
                // Specify the model to use (gpt-3.5-turbo is fast and cost-effective)
                Model = OpenAI.ObjectModels.Models.Gpt_3_5_Turbo
            };

            // 2. Call the API to get a completion
            var completionResult = await _openAiService.ChatCompletion.CreateCompletion(chatRequest);

            // 3. Check if the call was successful
            if (completionResult.Successful)
            {
                // Extract the response content and return it
                string? aiResponse = completionResult.Choices.FirstOrDefault()?.Message.Content;
                return Ok(new { Response = aiResponse });
            }
            else
            {
                // Handle API errors (e.g., bad API key, rate limits)
                var error = completionResult.Error;
                return StatusCode(500, $"OpenAI API error: {error?.Message}");
            }
        }
        catch (Exception ex)
        {
            // Handle general server errors
            return StatusCode(500, $"An unexpected error occurred: {ex.Message}");
        }
    }
}