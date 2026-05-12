using Google.GenAI;
using Microsoft.Extensions.Options;
using MindCartAI.Api.DTOs;
using MindCartAI.Api.Options;

namespace MindCartAI.Api.Services;

public class GeminiService : IGeminiService
{
    private readonly Client _client;
    private readonly ILogger<GeminiService> _logger;
    private readonly GeminiOptions _options;

    public GeminiService(IOptions<GeminiOptions> options, ILogger<GeminiService> logger)
    {
        _logger = logger;
        _options = options.Value;

        var apiKey = _options.ApiKey;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Gemini API key is missing. Check your appsettings.Development.json!");
        }

        _client = new Client(apiKey: apiKey);
    }

    public async Task<ProductAnalysisResponse> AnalyzeProductAsync(ProductAnalysisRequest request)
    {
        try
        {
            _logger.LogInformation("{ProductName} analizi için Gemini çağrılıyor...", request.ProductName);

            var prompt = $$"""
            Sen MindCart AI adlı bir alışveriş karar koruma asistanısın.

            Görevin:
            Kullanıcının satın almak istediği ürünü sahte yorum, manipülatif pazarlama dili,
            overpriced olma ihtimali ve dürtüsel alışveriş riski açısından analiz etmek.

            Ürün bilgileri:
            Ürün adı: {{request.ProductName}}
            Fiyat: {{request.Price}}
            Kategori: {{request.Category}}
            Ürün linki: {{request.ProductUrl}}
            Açıklama: {{request.Description}}
            Yorumlar: {{request.ReviewsText}}
            Kullanıcı aylık bütçesi: {{request.MonthlyBudget}}

            Analiz ederken özellikle şunlara dikkat et:
            - "Sadece bugün", "sınırlı stok", "kaçırılmayacak fırsat", "fenomenlerin favorisi" gibi manipülatif ifadeler
            - Çok genel, tekrar eden veya aşırı olumlu yorumlar
            - Fiyatın bütçeye oranı
            - Ani ve duygusal satın alma riski

            Yanıtını Türkçe ver.
            Kısa ama net bir finalRecommendation üret.
            FinalRecommendation en fazla 5 cümle olsun.
            Önce kısa karar ver: "Bekle", "Karşılaştır", "Mantıklı görünüyor" gibi.
            Sonra 2-3 cümleyle gerekçelendir.
            """;

            var response = await _client.Models.GenerateContentAsync(
                model: "gemini-2.5-flash",
                contents: prompt
            );

            var aiText = response.Text ?? "Analiz yapılamadı.";

            // Risk skorlarını hesapla
            var manipulationRisk = CalculateManipulationRisk(request.Description);
            var fakeReviewRisk = CalculateFakeReviewRisk(request.ReviewsText);
            var impulseRisk = CalculateImpulseRisk(request.Price, request.MonthlyBudget);
            var overpricedRisk = CalculateOverpricedRisk(request.Price, request.Category);

            var averageRisk = (manipulationRisk + fakeReviewRisk + impulseRisk + overpricedRisk) / 4;
            var decisionScore = Math.Max(0, 100 - averageRisk);

            // --- GÜNCELLEME BURASI ---
            // Yapay zeka "Bekle" veya "Karşılaştır" dediyse veya skor çok düşükse True döner
            var isCoolDownSuggested = aiText.Contains("Bekle", StringComparison.OrdinalIgnoreCase) || 
                                      aiText.Contains("Karşılaştır", StringComparison.OrdinalIgnoreCase) || 
                                      decisionScore < 45;

            return new ProductAnalysisResponse
            {
                FakeReviewRisk = fakeReviewRisk,
                ManipulationRisk = manipulationRisk,
                OverpricedRisk = overpricedRisk,
                ImpulseRisk = impulseRisk,
                DecisionScore = decisionScore,
                FinalRecommendation = aiText,
                IsCoolDownSuggested = isCoolDownSuggested,
                CoolDownReason = isCoolDownSuggested
                    ? "Analiz sonucu riskli bulundu veya yapay zeka tarafından bekleme süresi önerildi."
                    : ""
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini analizi sırasında hata oluştu.");
            throw;
        }
    }

    // Diğer yardımcı metotlar (Calculate metotları vb.) kodun devamında aynı kalabilir.
    public async Task<string> AskTextAsync(string prompt)
    {
        try
        {
            var response = await _client.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: prompt);
            return response.Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini hatası.");
            throw;
        }
    }

    public async IAsyncEnumerable<string> AskStreamAsync(string prompt)
    {
        var responseStream = _client.Models.GenerateContentStreamAsync(model: "gemini-2.5-flash", contents: prompt);
        await foreach (var chunk in responseStream)
        {
            if (!string.IsNullOrEmpty(chunk.Text)) yield return chunk.Text;
        }
    }

    private static int CalculateManipulationRisk(string? description)
    {
        if (string.IsNullOrWhiteSpace(description)) return 35;
        var text = description.ToLower();
        var riskyWords = new[] { "sadece bugün", "sınırlı stok", "kaçırılmayacak", "son fırsat", "fenomen", "influencer", "çok satan" };
        var risk = 30;
        foreach (var word in riskyWords) { if (text.Contains(word)) risk += 10; }
        return Math.Min(risk, 100);
    }

    private static int CalculateFakeReviewRisk(string? reviewsText)
    {
        if (string.IsNullOrWhiteSpace(reviewsText)) return 40;
        var text = reviewsText.ToLower();
        var suspiciousWords = new[] { "mükemmel", "harika", "herkes almalı", "kesin alın", "efsane" };
        var risk = 30;
        foreach (var word in suspiciousWords) { if (text.Contains(word)) risk += 8; }
        return Math.Min(risk, 100);
    }

    private static int CalculateImpulseRisk(decimal price, decimal? monthlyBudget)
    {
        if (monthlyBudget is null || monthlyBudget <= 0) return price >= 2000 ? 75 : 45;
        var ratio = price / monthlyBudget.Value;
        if (ratio >= 0.5m) return 90;
        if (ratio >= 0.3m) return 75;
        return 35;
    }

    private static int CalculateOverpricedRisk(decimal price, string? category)
    {
        return price > 2000 ? 60 : 40;
    }
}