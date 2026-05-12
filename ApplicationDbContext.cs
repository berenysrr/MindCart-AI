using Microsoft.EntityFrameworkCore;
using MindCartAI.Api.Models;

namespace MindCartAI.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Veritabanında oluşacak tablolarımız:
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductAnalysis> ProductAnalyses { get; set; }
    public DbSet<CoolDownItem> CoolDownItems { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<AppUser> AppUsers { get; set; }
}