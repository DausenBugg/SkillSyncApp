using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;

// Server/Program.cs

var builder = WebApplication.CreateBuilder(args);

// Get the OpenAI API Key from user secrets
string? openAiApiKey = builder.Configuration["OpenAI:ApiKey"];

// Register simple options holder
builder.Services.AddSingleton(new OpenAiOptions { ApiKey = openAiApiKey });

// Enable CORS for the frontend application
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

// Configure Entity Framework with MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySQL(connectionString);
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register a named HttpClient for OpenAI. Uses the API key from OpenAiOptions.
builder.Services.AddHttpClient("OpenAI", (sp, client) =>
{
    client.BaseAddress = new Uri("https://api.openai.com/v1/");
    var opts = sp.GetRequiredService<OpenAiOptions>();
    if (!string.IsNullOrWhiteSpace(opts.ApiKey))
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", opts.ApiKey);
    }
    client.DefaultRequestHeaders.UserAgent.ParseAdd("SkillSyncApp");
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);
app.UseAuthorization();
app.MapControllers();

app.Run();

public class OpenAiOptions
{
    public string? ApiKey { get; set; }
}