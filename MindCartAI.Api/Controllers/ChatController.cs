using Microsoft.AspNetCore.Mvc;
using MindCartAI.Api.Services;

namespace MindCartAI.Api.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IGeminiService _geminiService;

    public ChatController(IGeminiService geminiService)
    {
        _geminiService = geminiService;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> AskGemini([FromBody] string prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt))
            return BadRequest("Lütfen bir soru yazın.");

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

        var response = await _geminiService.AskTextAsync(systemPrompt);

        return Ok(new { response });
    }
}