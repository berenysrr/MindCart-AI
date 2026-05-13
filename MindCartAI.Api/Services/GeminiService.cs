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

            // Prompt güncellendi: Daha doyurucu ve yapılandırılmış yanıt için talimatlar genişletildi.
            var prompt = $$"""
Sen MindCart AI adlı, kullanıcının bütçesini ve mantığını koruyan profesyonel bir alışveriş asistanısın.

Görevin:
Ürünü; sahte yorumlar, manipülatif pazarlama dili, fiyat/performans dengesi ve dürtüsel alışveriş riski açısından derinlemesine analiz etmek.

Ürün bilgileri:
Ürün adı: {{request.ProductName}}
Fiyat: {{request.Price}} TL
Kategori: {{request.Category}}
Ürün linki: {{request.ProductUrl}}
Açıklama: {{request.Description}}
Yorumlar: {{request.ReviewsText}}
Kullanıcı aylık bütçesi: {{request.MonthlyBudget}} TL

Yanıtını şu 3 başlık altında, her başlık için en az 2-3 detaylı cümle kurarak Türkçe ver:

**KARAR:** Ürünün alınması mantıklı mı, bekleme sürecine mi alınmalı yoksa alternatiflere mi bakılmalı?
**SEBEP:** Üründeki manipülatif ifadeleri (örn: "son stok"), yorumların güvenilirliğini ve fiyatın bütçeye olan etkisini teknik olarak açıkla.
**ÖNERİ:** Kullanıcıya bu alışverişten en karlı çıkacağı net bir aksiyon öner.

Kurallar:
- Yanıtın toplamda 6-8 cümle arasında, doyurucu bir uzunlukta olsun.
- Markdown (kalın başlıklar) kullanarak yapılandırılmış bir metin sun.
- Kullanıcıyı sadece durdurmaya çalışma; doğru kararı vermesi için ikna edici ve bilgilendirici ol.
""";

            var response = await _client.Models.GenerateContentAsync(
                model: "gemini-2.5-flash",
                contents: prompt
            );

            var aiText = response.Text ?? "Analiz yapılamadı.";

            // Risk hesaplama mantığı (Aynı kaldı)
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
Sen MindCart AI adlı alışveriş karar asistanısın. Kullanıcıya alışveriş kararlarında yol göster.
Cevapların hem net hem de bilgilendirici olsun. Sadece "Al" veya "Alma" deme, sebebini açıkla.
En fazla 5-6 cümle kur. Türkçe cevap ver.

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

    // Risk hesaplama metodları (Değişmedi)
    private static int CalculateManipulationRisk(string? description)
    {
        if (string.IsNullOrWhiteSpace(description)) return 35;
        var text = description.ToLower();
        var riskyWords = new[] { "sadece bugün", "sınırlı stok", "kaçırılmayacak", "son fırsat", "fenomen", "influencer", "viral", "çok satan" };
        var risk = 30;
        foreach (var word in riskyWords) if (text.Contains(word)) risk += 10;
        return Math.Min(risk, 100);
    }

    private static int CalculateFakeReviewRisk(string? reviewsText)
    {
        if (string.IsNullOrWhiteSpace(reviewsText)) return 40;
        var text = reviewsText.ToLower();
        var suspiciousWords = new[] { "mükemmel", "harika", "herkes almalı", "efsane", "çok iyi", "kesin alın" };
        var risk = 30;
        foreach (var word in suspiciousWords) if (text.Contains(word)) risk += 8;
        return Math.Min(risk, 100);
    }

    private static int CalculateImpulseRisk(decimal price, decimal? monthlyBudget)
    {
        if (monthlyBudget is null || monthlyBudget <= 0) return price >= 2000 ? 75 : 45;
        var ratio = price / monthlyBudget.Value;
        if (ratio >= 0.5m) return 90;
        if (ratio >= 0.3m) return 75;
        if (ratio >= 0.15m) return 55;
        return 35;
    }

    private static int CalculateOverpricedRisk(decimal price, string? category)
    {
        if (price <= 0) return 30;
        var categoryLower = category?.ToLower() ?? "";
        if (categoryLower.Contains("kozmetik")) return price > 1000 ? 65 : 45;
        if (categoryLower.Contains("elektronik")) return price > 3000 ? 60 : 40;
        if (categoryLower.Contains("fashion")) return price > 1500 ? 60 : 40;
        return price > 2000 ? 60 : 40;
    }
}