namespace MindCartAI.Api.Models;

public class ChatMessage
{
    public int Id { get; set; }

    public string UserMessage { get; set; } = string.Empty;

    public string AiResponse { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.Now;
}