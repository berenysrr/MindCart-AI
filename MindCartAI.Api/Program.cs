using Microsoft.EntityFrameworkCore;
using MindCartAI.Api.Data;
using MindCartAI.Api.Services;
using MindCartAI.Api.Options;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Gemini Options
builder.Services.Configure<GeminiOptions>(
    builder.Configuration.GetSection("Gemini"));

// Gemini Service
builder.Services.AddScoped<IGeminiService, GeminiService>();

var app = builder.Build();

// Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();