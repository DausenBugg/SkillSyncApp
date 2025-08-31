// --- Add all necessary 'using' statements at the top ---
using Microsoft.EntityFrameworkCore;
// Server/Program.cs
using OpenAI.Extensions; // <--- Add this using directive

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURE SERVICES ---

// Get the OpenAI API Key from user secrets
string? openAiApiKey = builder.Configuration["OpenAI:ApiKey"];

// Add the OpenAI Client to the services container
builder.Services.AddOpenAIService(settings =>
{
    settings.ApiKey = openAiApiKey;
});

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // This MUST match the URL of your React app
                          policy.WithOrigins("http://localhost:5173") 
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySQL(connectionString);
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- 2. BUILD THE APP ---
var app = builder.Build();

// --- 3. CONFIGURE THE HTTP REQUEST PIPELINE ---
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