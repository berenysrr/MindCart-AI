using Microsoft.AspNetCore.Mvc;
using MindCartAI.Api.Data;
using MindCartAI.Api.DTOs;
using MindCartAI.Api.Models;
using MindCartAI.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MindCartAI.Api.Controllers;

[ApiController]
[Route("api/product-analysis")]
public class ProductAnalysisController : ControllerBase
{
    private readonly IGeminiService _geminiService;
    private readonly ApplicationDbContext _context;

    public ProductAnalysisController(
        IGeminiService geminiService,
        ApplicationDbContext context)
    {
        _geminiService = geminiService;
        _context = context;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeProduct(ProductAnalysisRequest request)
    {
        var aiResult = await _geminiService.AnalyzeProductAsync(request);

        var product = new Product
        {
            Name = request.ProductName,
            Price = request.Price,
            Category = request.Category,
            Url = request.ProductUrl,
            Description = request.Description,
            ReviewsText = request.ReviewsText
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var analysis = new ProductAnalysis
        {
            ProductId = product.Id,
            FakeReviewRisk = aiResult.FakeReviewRisk,
            ManipulationRisk = aiResult.ManipulationRisk,
            OverpricedRisk = aiResult.OverpricedRisk,
            ImpulseRisk = aiResult.ImpulseRisk,
            DecisionScore = aiResult.DecisionScore,
            FinalRecommendation = aiResult.FinalRecommendation,
            IsCoolDownSuggested = aiResult.IsCoolDownSuggested
        };

        _context.ProductAnalyses.Add(analysis);

        if (aiResult.IsCoolDownSuggested)
        {
            var coolDownItem = new CoolDownItem
            {
                ProductId = product.Id,
                Reason = aiResult.CoolDownReason,
                LockedUntil = DateTime.Now.AddHours(24),
                Status = "Active"
            };

            _context.CoolDownItems.Add(coolDownItem);
        }

        await _context.SaveChangesAsync();

        return Ok(aiResult);
    }

    [HttpGet("history")]
public IActionResult GetHistory()
{
    var history = _context.ProductAnalyses
        .Include(x => x.Product)
        .OrderByDescending(x => x.CreatedAt)
        .Select(x => new
        {
            x.Id,
            x.ProductId,
            ProductName = x.Product != null ? x.Product.Name : "",
            ProductPrice = x.Product != null ? x.Product.Price : 0,
            ProductCategory = x.Product != null ? x.Product.Category : "",
            x.FakeReviewRisk,
            x.ManipulationRisk,
            x.OverpricedRisk,
            x.ImpulseRisk,
            x.DecisionScore,
            x.FinalRecommendation,
            x.IsCoolDownSuggested,
            x.CreatedAt
        })
        .ToList();

    return Ok(history);
}
}