public class ResumeAnalysis
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ResumeText { get; set; } = "";
    public string JobDescription { get; set; } = "";
    public double MatchScore { get; set; }
    public string MatchingSkills { get; set; } = ""; // JSON array
    public string MissingSkills { get; set; } = "";  // JSON array
    public string Analysis { get; set; } = "";
    public string Improvements { get; set; } = "";   // JSON array
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public User? User { get; set; }
}