using Microsoft.AspNetCore.Mvc;
using MindCartAI.Api.Data;
using MindCartAI.Api.DTOs;
using MindCartAI.Api.Models;
using MindCartAI.Api.Services;
using MindCartAI.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MindCartAI.Api.Controllers;

[ApiController]
[Route("api/product-analysis")]
public class ProductAnalysisController : ControllerBase
{
    private readonly IGeminiService _geminiService;
    private readonly ApplicationDbContext _context;
    private readonly IProductAnalysisRepository _repository; // Repository eklendi

    public ProductAnalysisController(
        IGeminiService geminiService,
        ApplicationDbContext context,
        IProductAnalysisRepository repository) // Inject edildi
    {
        _geminiService = geminiService;
        _context = context;
        _repository = repository;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeProduct(ProductAnalysisRequest request)
    {
        // 1. Önce yapay zeka analizini alalım
        var aiResult = await _geminiService.AnalyzeProductAsync(request);

        // 2. Ürünü kaydet veya mevcut olanı bul (Product kaydı korunsun)
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Url == request.ProductUrl);
        if (product == null)
        {
            product = new Product
            {
                Name = request.ProductName,
                Price = request.Price,
                Category = request.Category,
                Url = request.ProductUrl,
                Description = request.Description,
                ReviewsText = request.ReviewsText
            };
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
        }

        // 3. Analizi kaydet (ProductId ve UserId ile bağlansın)
        var analysis = new ProductAnalysis
        {
            ProductId = product.Id,
            UserId = request.UserId, // Request'ten gelen UserId
            FakeReviewRisk = aiResult.FakeReviewRisk,
            ManipulationRisk = aiResult.ManipulationRisk,
            OverpricedRisk = aiResult.OverpricedRisk,
            ImpulseRisk = aiResult.ImpulseRisk,
            DecisionScore = aiResult.DecisionScore,
            FinalRecommendation = aiResult.FinalRecommendation,
            IsCoolDownSuggested = aiResult.IsCoolDownSuggested,
            CreatedAt = DateTime.Now
        };

        // Repository kullanarak kaydet (Beren'in istediği yöntem)
        await _repository.AddAsync(analysis);

        // 4. Riskli ürün analiz edilince CoolDownItem oluşsun
        if (aiResult.IsCoolDownSuggested)
        {
            var coolDownItem = new CoolDownItem
            {
                ProductId = product.Id,
                UserId = request.UserId, // Kullanıcıya bağlanmalı
                Reason = aiResult.CoolDownReason,
                LockedUntil = DateTime.Now.AddHours(24),
                Status = "Active"
            };

            _context.CoolDownItems.Add(coolDownItem);
            await _context.SaveChangesAsync();
        }

        return Ok(aiResult);
    }

    // --- Beren'in İstediği 3. Madde: Eski history endpoint'i bozulmasın ---
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _context.ProductAnalyses
            .Include(x => x.Product)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
        return Ok(history);
    }

    // --- Beren'in İstediği 6. Madde: UserId'ye göre history filtreleme ---
    [HttpGet("history/{userId}")]
    public async Task<IActionResult> GetUserHistory(int userId)
    {
        var history = await _repository.GetByUserIdAsync(userId);
        return Ok(history);
    }

    // --- Beren'in İstediği 5. Madde: Analiz geçmişinden silme ---
    [HttpDelete("history/{id}")]
    public async Task<IActionResult> DeleteAnalysis(int id)
    {
        await _repository.DeleteAsync(id);
        return Ok(new { message = "Analiz başarıyla silindi." });
    }
}