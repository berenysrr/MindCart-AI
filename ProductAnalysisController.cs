using Microsoft.AspNetCore.Mvc;
using MindCartAI.Api.DTOs;
using MindCartAI.Api.Models;
using MindCartAI.Api.Repositories;
using MindCartAI.Api.Services;

namespace MindCartAI.Api.Controllers;

[ApiController]
[Route("api/product-analysis")]
public class ProductAnalysisController : ControllerBase
{
    private readonly IGeminiService _geminiService;
    private readonly IProductAnalysisRepository _productRepository;

    public ProductAnalysisController(
        IGeminiService geminiService,
        IProductAnalysisRepository productRepository)
    {
        _geminiService = geminiService;
        _productRepository = productRepository;
    }

    // 1. Analiz Yap ve Kaydet
    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeProduct([FromBody] ProductAnalysisRequest request)
    {
        // Beren'in AI servisini çağırıyoruz
        var aiResult = await _geminiService.AnalyzeProductAsync(request);

        // Veritabanına kaydedilecek modelimizi oluşturuyoruz
        var analysis = new ProductAnalysis
        {
            UserId = request.UserId, // Önemli: Hangi kullanıcı olduğunu kaydediyoruz
            FakeReviewRisk = aiResult.FakeReviewRisk,
            ManipulationRisk = aiResult.ManipulationRisk,
            OverpricedRisk = aiResult.OverpricedRisk,
            ImpulseRisk = aiResult.ImpulseRisk,
            DecisionScore = aiResult.DecisionScore,
            FinalRecommendation = aiResult.FinalRecommendation,
            IsCoolDownSuggested = aiResult.IsCoolDownSuggested,
            CreatedAt = DateTime.Now
        };

        // SENİN YAZDIĞIN REPOSITORY İLE KAYIT:
        await _productRepository.AddAnalysisAsync(analysis);

        return Ok(aiResult);
    }

    // 2. Kullanıcının Geçmişini Getir
    [HttpGet("history/{userId}")]
    public async Task<IActionResult> GetHistory(int userId)
    {
        var history = await _productRepository.GetAnalysisHistoryAsync(userId);
        return Ok(history);
    }

    // 3. Analiz Sil (Yeni ekledik!)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _productRepository.DeleteAnalysisAsync(id);
        if (!result) return NotFound("Silinecek analiz bulunamadı.");
        
        return Ok(new { message = "Analiz başarıyla silindi." });
    }

    // 4. Kurtarılan Alışveriş Sayısı (Yeni ekledik!)
    [HttpGet("saved-count/{userId}")]
    public async Task<IActionResult> GetSavedCount(int userId)
    {
        var count = await _productRepository.GetSavedMoneyCountAsync(userId);
        return Ok(new { totalSavedAnalyses = count });
    }
}