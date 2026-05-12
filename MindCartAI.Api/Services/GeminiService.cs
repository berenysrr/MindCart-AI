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
Sen MindCart AI adlı kısa, net ve karar odaklı bir alışveriş karar koruma asistanısın.

Görevin:
Kullanıcının satın almak istediği ürünü sahte yorum, manipülatif pazarlama dili, overpriced olma ihtimali ve dürtüsel alışveriş riski açısından analiz etmek.

Ürün bilgileri:
Ürün adı: {{request.ProductName}}
Fiyat: {{request.Price}} TL
Kategori: {{request.Category}}
Ürün linki: {{request.ProductUrl}}
Açıklama: {{request.Description}}
Yorumlar: {{request.ReviewsText}}
Kullanıcı aylık bütçesi: {{request.MonthlyBudget}} TL

Analizde özellikle şunlara dikkat et:
- "Sadece bugün", "sınırlı stok", "kaçırılmayacak fırsat", "fenomenlerin favorisi" gibi manipülatif ifadeler
- Çok genel, tekrar eden veya aşırı olumlu yorumlar
- Fiyatın kullanıcının aylık bütçesine oranı
- Ani ve duygusal satın alma riski

Yanıtını Türkçe ver.

Yanıt formatın kesinlikle şu yapıda olsun:
Karar: Bekle / Karşılaştır / Mantıklı görünüyor.
Sebep: En fazla 2 kısa cümleyle açıkla.
Öneri: Kullanıcıya tek net aksiyon ver.

Kurallar:
- Toplam cevap en fazla 4 cümle olsun.
- FinalRecommendation gibi başlıklar yazma.
- Markdown, yıldızlı metin, uzun liste veya maddeleme kullanma.
- Kullanıcıyı tamamen alışverişten vazgeçirmeye çalışma; daha bilinçli karar vermesine yardım et.
""";

            var response = await _client.Models.GenerateContentAsync(
                model: "gemini-2.5-flash",
                contents: prompt
            );

            var aiText = response.Text ?? "Analiz yapılamadı.";

            var manipulationRisk = CalculateManipulationRisk(request.Description);
            var fakeReviewRisk = CalculateFakeReviewRisk(request.ReviewsText);
            var impulseRisk = CalculateImpulseRisk(request.Price, request.MonthlyBudget);
            var overpricedRisk = CalculateOverpricedRisk(request.Price, request.Category);

            var averageRisk = (manipulationRisk + fakeReviewRisk + impulseRisk + overpricedRisk) / 4;
            var decisionScore = Math.Max(0, 100 - averageRisk);

            var isCoolDownSuggested =
                manipulationRisk >= 75 ||
                impulseRisk >= 70 ||
                decisionScore < 45 ||
                aiText.Contains("Bekle", StringComparison.OrdinalIgnoreCase);

            return new ProductAnalysisResponse
            {
                FakeReviewRisk = fakeReviewRisk,
                ManipulationRisk = manipulationRisk,
                OverpricedRisk = overpricedRisk,
                ImpulseRisk = impulseRisk,
                DecisionScore = decisionScore,
                FinalRecommendation = aiText.Trim(),
                IsCoolDownSuggested = isCoolDownSuggested,
                CoolDownReason = isCoolDownSuggested
                    ? "Yüksek manipülasyon veya dürtüsel alışveriş riski tespit edildi. 24 saatlik düşünme süresi önerilir."
                    : ""
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini analizi sırasında hata oluştu.");
            throw;
        }
    }

    public async Task<string> AskTextAsync(string prompt)
    {
        try
        {
            _logger.LogInformation("Gemini'a soru soruluyor...");

            var systemPrompt = $"""
Sen MindCart AI adlı kısa ve net cevap veren bir alışveriş karar asistanısın.

Görevin:
Kullanıcının bütçesine, ürün fiyatına ve satın alma zamanına göre pratik karar vermesine yardım etmek.

Kurallar:
- Cevabın en fazla 4 cümle olsun.
- Madde madde uzun açıklama yapma.
- Önce net karar ver: "Alabilirsin", "Bekle", "Karşılaştır" veya "Bütçeyi artır".
- Sonra çok kısa gerekçe yaz.
- Markdown, yıldızlı metin veya başlık kullanma.
- Türkçe cevap ver.

Kullanıcı sorusu:
{prompt}
""";

            var response = await _client.Models.GenerateContentAsync(
                model: "gemini-2.5-flash",
                contents: systemPrompt
            );

            return response.Text?.Trim() ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini ile iletişim sırasında hata oluştu.");
            throw;
        }
    }

    public async IAsyncEnumerable<string> AskStreamAsync(string prompt)
    {
        _logger.LogInformation("Gemini'dan streaming yanıt bekleniyor...");

        var responseStream = _client.Models.GenerateContentStreamAsync(
            model: "gemini-2.5-flash",
            contents: prompt
        );

        await foreach (var chunk in responseStream)
        {
            if (!string.IsNullOrEmpty(chunk.Text))
            {
                yield return chunk.Text;
            }
        }
    }

    private static int CalculateManipulationRisk(string? description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return 35;

        var text = description.ToLower();

        var riskyWords = new[]
        {
            "sadece bugün",
            "sınırlı stok",
            "kaçırılmayacak",
            "son fırsat",
            "fenomen",
            "influencer",
            "%70",
            "%80",
            "herkes alıyor",
            "çok satan",
            "viral",
            "popüler ürün",
            "sezon indirimi"
        };

        var risk = 30;

        foreach (var word in riskyWords)
        {
            if (text.Contains(word))
                risk += 10;
        }

        return Math.Min(risk, 100);
    }

    private static int CalculateFakeReviewRisk(string? reviewsText)
    {
        if (string.IsNullOrWhiteSpace(reviewsText))
            return 40;

        var text = reviewsText.ToLower();

        var suspiciousWords = new[]
        {
            "mükemmel",
            "harika",
            "herkes almalı",
            "hayatımı değiştirdi",
            "efsane",
            "çok iyi",
            "kesin alın",
            "beklediğimden iyi"
        };

        var risk = 30;

        foreach (var word in suspiciousWords)
        {
            if (text.Contains(word))
                risk += 8;
        }

        return Math.Min(risk, 100);
    }

    private static int CalculateImpulseRisk(decimal price, decimal? monthlyBudget)
    {
        if (monthlyBudget is null || monthlyBudget <= 0)
        {
            return price >= 2000 ? 75 : 45;
        }

        var ratio = price / monthlyBudget.Value;

        if (ratio >= 0.5m)
            return 90;

        if (ratio >= 0.3m)
            return 75;

        if (ratio >= 0.15m)
            return 55;

        return 35;
    }

    private static int CalculateOverpricedRisk(decimal price, string? category)
    {
        if (price <= 0)
            return 30;

        var categoryLower = category?.ToLower() ?? "";

        if (categoryLower.Contains("cosmetic") || categoryLower.Contains("kozmetik") || categoryLower.Contains("beauty"))
        {
            return price > 1000 ? 65 : 45;
        }

        if (categoryLower.Contains("electronics") || categoryLower.Contains("elektronik"))
        {
            return price > 3000 ? 60 : 40;
        }

        if (categoryLower.Contains("fashion"))
        {
            return price > 1500 ? 60 : 40;
        }

        if (categoryLower.Contains("education"))
        {
            return price > 1000 ? 45 : 25;
        }

        if (categoryLower.Contains("home") || categoryLower.Contains("sleep"))
        {
            return price > 1000 ? 55 : 35;
        }

        return price > 2000 ? 60 : 40;
    }
}