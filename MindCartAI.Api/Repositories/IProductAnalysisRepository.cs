using MindCartAI.Api.Models;

namespace MindCartAI.Api.Repositories;

public interface IProductAnalysisRepository
{
    Task<IEnumerable<ProductAnalysis>> GetByUserIdAsync(int userId); // Kullanıcıya göre filtreleme (Beren'in 6. maddesi)
    Task AddAsync(ProductAnalysis analysis);
    Task DeleteAsync(int id); // Silme işlemi (Beren'in 5. maddesi)
}