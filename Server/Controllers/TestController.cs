// Server/Controllers/TestController.cs
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("message")]
    public IActionResult GetTestMessage()
    {
        var response = new { Message = "Hello! The connection from React to ASP.NET is working!" };
        return Ok(response);
    }
}