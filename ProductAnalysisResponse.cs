namespace MindCartAI.Api.DTOs;

public class ProductAnalysisResponse
{
    public int FakeReviewRisk { get; set; }

    public int ManipulationRisk { get; set; }

    public int OverpricedRisk { get; set; }

    public int ImpulseRisk { get; set; }

    public int DecisionScore { get; set; }

    public string FinalRecommendation { get; set; } = string.Empty;

    public bool IsCoolDownSuggested { get; set; }

    public string CoolDownReason { get; set; } = string.Empty;
}