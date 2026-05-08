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
        Sen MindCart AI alışveriş karar asistanısın.
        Kullanıcıya online alışverişte daha bilinçli karar vermesi için kısa, net ve pratik cevaplar ver.
        Kullanıcıyı tamamen alışverişten vazgeçirmeye çalışma; doğru, güvenli ve mantıklı karar vermesine yardım et.

        Kullanıcı sorusu:
        {prompt}
        """;

        var response = await _geminiService.AskTextAsync(systemPrompt);

        return Ok(new { response });
    }
}