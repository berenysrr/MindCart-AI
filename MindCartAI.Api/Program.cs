using Microsoft.EntityFrameworkCore;
using MindCartAI.Api.Data;
using MindCartAI.Api.Services;
using MindCartAI.Api.Options;
using MindCartAI.Api.Repositories; // Repository namespace'ini ekledik

var builder = WebApplication.CreateBuilder(args);

// --- CORS AYARLARI ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --- CONTROLLERS + SWAGGER ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- DATABASE ---
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    }
    else
    {
        options.UseInMemoryDatabase("MindCartLiveDb");
    }
});

// --- CONFIGURATIONS & OPTIONS ---
builder.Services.Configure<GeminiOptions>(
    builder.Configuration.GetSection("Gemini"));

// --- DEPENDENCY INJECTION (SERVIS KAYITLARI) ---

// Gemini Service (AI Mantığı)
builder.Services.AddScoped<IGeminiService, GeminiService>();

// Repository Layer (Veritabanı Mantığı)
// Beren'in istediği kritik ekleme burasıdır:
builder.Services.AddScoped<IProductAnalysisRepository, ProductAnalysisRepository>();

var app = builder.Build();

// --- HTTP REQUEST PIPELINE ---

// Swagger UI (Sadece Geliştirme Ortamında)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS Politikası (Frontend ile bağlantı için şart)
app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();