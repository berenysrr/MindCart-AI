using MindCartAI.Api.Models;

namespace MindCartAI.Api.Repositories;

public interface IProductAnalysisRepository
{
    Task AddAnalysisAsync(ProductAnalysis analysis); 
    Task<IEnumerable<ProductAnalysis>> GetAnalysisHistoryAsync(int userId);
    
    // Yeni Eklenenler:
    Task<bool> DeleteAnalysisAsync(int id); // Analiz silme
    Task<int> GetSavedMoneyCountAsync(int userId); // Engellenen riskli alışveriş sayısı
}