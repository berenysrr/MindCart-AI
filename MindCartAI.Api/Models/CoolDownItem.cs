namespace MindCartAI.Api.Models;

public class CoolDownItem
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public Product? Product { get; set; }

    public string Reason { get; set; } = string.Empty;

    public DateTime LockedUntil { get; set; }

    public string Status { get; set; } = "Active";

    public int UserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

}
