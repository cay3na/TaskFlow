using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Models;

namespace TaskFlow.API.Services;


public class AuthService : IAuthService
{

    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Check if email is already taken
        bool emailExists = await _context.Users
            .AnyAsync(u => u.Email == dto.Email);

        if (emailExists)
            throw new InvalidOperationException("An account with this email already exists.");

        string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = passwordHash
        };

        // Add to the DbContext (marks it as "to be inserted")
        _context.Users.Add(user);

        // SaveChangesAsync() writes the INSERT statement to the database
        await _context.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        // Find user by email
        var user = await _context.Users
            .SingleOrDefaultAsync(u => u.Email == dto.Email);

        // Same generic error for both "user not found" and "wrong password"
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return CreateAuthResponse(user);
    }

    private AuthResponseDto CreateAuthResponse(User user)
    {
        var expiry = DateTime.UtcNow.AddHours(24);
        var token = GenerateJwtToken(user, expiry);

        return new AuthResponseDto
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Token = token,
            TokenExpiry = expiry
        };
    }

    private string GenerateJwtToken(User user, DateTime expiry)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: credentials
        );

        // Serializes the token to the string format: xxxxx.yyyyy.zzzzz
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
