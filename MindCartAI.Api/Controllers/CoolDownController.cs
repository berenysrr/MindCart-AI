using Microsoft.AspNetCore.Mvc;
using MindCartAI.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MindCartAI.Api.Controllers;

[ApiController]
[Route("api/cooldown")]
public class CoolDownController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CoolDownController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("active")]
public IActionResult GetActiveCoolDownItems()
{
    var items = _context.CoolDownItems
        .Include(x => x.Product)
        .Where(x => x.Status == "Active" && x.LockedUntil > DateTime.Now)
        .OrderByDescending(x => x.CreatedAt)
        .Select(x => new
        {
            x.Id,
            x.ProductId,
            ProductName = x.Product != null ? x.Product.Name : "",
            ProductPrice = x.Product != null ? x.Product.Price : 0,
            ProductCategory = x.Product != null ? x.Product.Category : "",
            x.Reason,
            x.LockedUntil,
            x.Status,
            x.CreatedAt
        })
        .ToList();

    return Ok(items);
}
}