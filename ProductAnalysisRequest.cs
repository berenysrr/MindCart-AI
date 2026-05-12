namespace MindCartAI.Api.DTOs;

public class ProductAnalysisRequest
{
    public int UserId { get; set; } // Hata burası eksik olduğu için çıkıyordu, ekledik.
    public string ProductName { get; set; } = string.Empty;
    public string ProductUrl { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ReviewsText { get; set; } = string.Empty;
    public decimal? MonthlyBudget { get; set; }
}