using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/analysis")]
public class ResumeAnalysisController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResumeAnalysisController(ApplicationDbContext db)
    {
        _db = db;
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyAnalyses()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var analyses = await _db.ResumeAnalyses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(analyses.Select(a => new {
            a.Id,
            a.JobTitle,
            a.JobDescription,
            a.MatchScore,
            a.CreatedAt
        }));
    }

    [Authorize]
    [HttpPost("save")]
    public async Task<IActionResult> SaveAnalysis([FromBody] ResumeAnalysis analysis)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        analysis.UserId = userId;
        analysis.CreatedAt = DateTime.UtcNow;
        _db.ResumeAnalyses.Add(analysis);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Analysis saved." });
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetAnalysisById(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var analysis = await _db.ResumeAnalyses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (analysis == null)
            return NotFound();

        return Ok(new
        {
            analysis.Id,
            analysis.JobTitle,
            analysis.JobDescription,
            analysis.MatchScore,
            analysis.CreatedAt,
            matchingSkills = string.IsNullOrEmpty(analysis.MatchingSkills) ? new string[0] : System.Text.Json.JsonSerializer.Deserialize<string[]>(analysis.MatchingSkills),
            missingSkills = string.IsNullOrEmpty(analysis.MissingSkills) ? new string[0] : System.Text.Json.JsonSerializer.Deserialize<string[]>(analysis.MissingSkills),
            analysis = analysis.Analysis,
            improvements = string.IsNullOrEmpty(analysis.Improvements) ? new object[0] : System.Text.Json.JsonSerializer.Deserialize<object[]>(analysis.Improvements)
        });
    }
}