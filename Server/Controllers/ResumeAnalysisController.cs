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
}