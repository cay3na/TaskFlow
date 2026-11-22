using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;

namespace TaskFlow.API.Data;


public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.HasIndex(u => u.Email).IsUnique();

            entity.Property(u => u.Email).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Name).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(60);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Description).HasMaxLength(1000);

            entity.HasOne(p => p.Owner)
                  .WithMany(u => u.Projects)
                  .HasForeignKey(p => p.OwnerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Title).IsRequired().HasMaxLength(300);
            entity.Property(t => t.Description).HasMaxLength(2000);

            entity.Property(t => t.Status)
                  .HasConversion<string>();

            entity.HasOne(t => t.Project)
                  .WithMany(p => p.Tasks)
                  .HasForeignKey(t => t.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.AssignedTo)
                  .WithMany(u => u.AssignedTasks)
                  .HasForeignKey(t => t.AssignedToId)
                  .OnDelete(DeleteBehavior.NoAction)
                  .IsRequired(false);
        });
    }
}
