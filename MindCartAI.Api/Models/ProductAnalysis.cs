namespace MindCartAI.Api.Models;

public class ProductAnalysis
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public Product? Product { get; set; }

    public int FakeReviewRisk { get; set; }

    public int ManipulationRisk { get; set; }

    public int OverpricedRisk { get; set; }

    public int ImpulseRisk { get; set; }

    public int DecisionScore { get; set; }

    public string FinalRecommendation { get; set; } = string.Empty;

    public bool IsCoolDownSuggested { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}