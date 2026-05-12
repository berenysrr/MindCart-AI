using Microsoft.EntityFrameworkCore;
using MindCartAI.Api.Data;
using MindCartAI.Api.Models;

namespace MindCartAI.Api.Repositories;

public class ProductAnalysisRepository : IProductAnalysisRepository
{
    private readonly ApplicationDbContext _context;

    public ProductAnalysisRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // 1. Yeni bir analizi veritabanına kaydeder
    public async Task AddAnalysisAsync(ProductAnalysis analysis)
    {
        await _context.ProductAnalyses.AddAsync(analysis);
        await _context.SaveChangesAsync();
    }

    // 2. Kullanıcının tüm geçmişini tersten (en yeni en üstte) getirir
    public async Task<IEnumerable<ProductAnalysis>> GetAnalysisHistoryAsync(int userId)
    {
        return await _context.ProductAnalyses
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    // 3. ID'ye göre belirli bir analizi siler
    public async Task<bool> DeleteAnalysisAsync(int id)
    {
        var analysis = await _context.ProductAnalyses.FindAsync(id);
        
        if (analysis == null) 
            return false;

        _context.ProductAnalyses.Remove(analysis);
        await _context.SaveChangesAsync();
        return true;
    }

    // 4. Kullanıcının engellenen/riskli (IsCoolDownSuggested = 1) harcamalarını sayar
    public async Task<int> GetSavedMoneyCountAsync(int userId)
    {
        // IsCoolDownSuggested = true olanları filtreleyip sayısını döner
        return await _context.ProductAnalyses
            .CountAsync(x => x.UserId == userId && x.IsCoolDownSuggested);
    }
}