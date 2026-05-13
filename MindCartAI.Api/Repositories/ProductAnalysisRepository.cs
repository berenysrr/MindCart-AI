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

    public async Task<IEnumerable<ProductAnalysis>> GetByUserIdAsync(int userId)
    {
        // Beren'in istediği filtreleme: Sadece o kullanıcıyı ve en yeniden en eskiye getirir
        return await _context.ProductAnalyses
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(ProductAnalysis analysis)
    {
        await _context.ProductAnalyses.AddAsync(analysis);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var analysis = await _context.ProductAnalyses.FindAsync(id);
        if (analysis != null)
        {
            _context.ProductAnalyses.Remove(analysis);
            await _context.SaveChangesAsync();
        }
    }
}