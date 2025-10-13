using System;
using System.ComponentModel.DataAnnotations;

public class ResumeAnalysis
{
    public int Id { get; set; }
    public int UserId { get; set; }

    [Required]
    public string ResumeText { get; set; } = "";

    [Required]
    public string JobDescription { get; set; } = "";

    public double MatchScore { get; set; }

    public string MatchingSkills { get; set; } = ""; // JSON array as string

    public string MissingSkills { get; set; } = "";  // JSON array as string

    public string Analysis { get; set; } = "";

    public string Improvements { get; set; } = "";   // JSON array as string

    public string JobTitle { get; set; } = ""; // Optional, for display

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public User? User { get; set; }
}