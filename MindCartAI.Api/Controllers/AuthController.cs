using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindCartAI.Api.Data;
using MindCartAI.Api.DTOs;
using MindCartAI.Api.Models;

namespace MindCartAI.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Tüm alanlar doldurulmalıdır.");
        }

        var emailExists = await _context.AppUsers
            .AnyAsync(x => x.Email == request.Email);

        if (emailExists)
        {
            return BadRequest("Bu e-posta adresi zaten kayıtlı.");
        }

        var user = new AppUser
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _context.AppUsers.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new AuthResponse
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Message = "Kayıt başarılı."
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _context.AppUsers
            .FirstOrDefaultAsync(x => x.Email == request.Email);

        if (user == null)
        {
            return BadRequest("E-posta veya şifre hatalı.");
        }

        var isPasswordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash
        );

        if (!isPasswordValid)
        {
            return BadRequest("E-posta veya şifre hatalı.");
        }

        return Ok(new AuthResponse
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Message = "Giriş başarılı."
        });
    }
}