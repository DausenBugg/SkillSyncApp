// Server/Models/User.cs
using System.ComponentModel.DataAnnotations;

public class User
{
    public int Id { get; set; }

    [MaxLength(255)]
    public string Email { get; set; } = "";

    [MaxLength(255)]
    public string Password { get; set; } = ""; // Changed from PasswordHash to Password

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}