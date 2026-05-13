namespace MindCartAI.Api.DTOs;

public class ProductAnalysisRequest
{
    public string ProductName { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int UserId { get; set; }

    public string Category { get; set; } = string.Empty;

    public string? ProductUrl { get; set; }

    public string? Description { get; set; }

    public string? ReviewsText { get; set; }

    public decimal? MonthlyBudget { get; set; }
}