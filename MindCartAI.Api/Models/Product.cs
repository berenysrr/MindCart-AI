namespace MindCartAI.Api.Models;

public class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string Category { get; set; } = string.Empty;

    public string? Url { get; set; }

    public string? Description { get; set; }

    public string? ReviewsText { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}