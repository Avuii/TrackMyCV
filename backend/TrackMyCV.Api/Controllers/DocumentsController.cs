using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackMyCV.Api.Auth;
using TrackMyCV.Domain.Entities;
using TrackMyCV.Infrastructure.Data;

namespace TrackMyCV.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private const long MaxFileBytes = 20_000_000;
    private const int MaxTextDocumentCharacters = 60_000;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf",
        ".doc",
        ".docx",
        ".txt",
        ".rtf",
        ".png",
        ".jpg",
        ".jpeg"
    };

    private readonly AppDbContext _dbContext;
    private readonly IWebHostEnvironment _environment;

    public DocumentsController(AppDbContext dbContext, IWebHostEnvironment environment)
    {
        _dbContext = dbContext;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentDto>>> GetAll()
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var documents = await _dbContext.UserDocuments
            .Where(x => x.AppUserId == userId.Value)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();

        var cvNames = await _dbContext.JobApplications
            .Where(x => x.AppUserId == userId.Value && x.CvName != string.Empty)
            .Select(x => x.CvName)
            .ToListAsync();

        var usageByName = cvNames
            .GroupBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.Count(), StringComparer.OrdinalIgnoreCase);

        return Ok(documents.Select(document => MapDocument(document, usageByName.GetValueOrDefault(document.Name))).ToList());
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20_000_000)]
    public async Task<ActionResult<DocumentDto>> Upload([FromForm] UploadDocumentRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        if (request.File is null || request.File.Length == 0)
        {
            return BadRequest("Choose a file to upload.");
        }

        if (request.File.Length > MaxFileBytes)
        {
            return BadRequest("File is too large. Upload files up to 20 MB.");
        }

        var originalFileName = Path.GetFileName(request.File.FileName);

        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            return BadRequest("Uploaded file must have a file name.");
        }

        var extension = Path.GetExtension(originalFileName);

        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            return BadRequest("Unsupported file type. Upload PDF, DOC, DOCX, TXT, RTF, PNG or JPG files.");
        }

        var documentId = Guid.NewGuid();
        var userFolderName = userId.Value.ToString("N");
        var storedFileName = $"{documentId:N}{extension.ToLowerInvariant()}";
        var relativePath = Path.Combine(userFolderName, storedFileName);
        var absoluteFolder = Path.Combine(GetUploadRoot(), userFolderName);
        var absolutePath = Path.Combine(absoluteFolder, storedFileName);

        Directory.CreateDirectory(absoluteFolder);

        await using (var stream = System.IO.File.Create(absolutePath))
        {
            await request.File.CopyToAsync(stream);
        }

        var now = DateTime.UtcNow;
        var document = new UserDocument
        {
            Id = documentId,
            AppUserId = userId.Value,
            Name = TrimTo(string.IsNullOrWhiteSpace(request.Name) ? Path.GetFileNameWithoutExtension(originalFileName) : request.Name.Trim(), 220),
            Type = TrimTo(string.IsNullOrWhiteSpace(request.Type) ? InferDocumentType(originalFileName) : request.Type.Trim(), 80),
            Category = TrimTo(string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(), 100),
            OriginalFileName = TrimTo(originalFileName, 260),
            StoredFileName = storedFileName,
            ContentType = TrimTo(string.IsNullOrWhiteSpace(request.File.ContentType) ? "application/octet-stream" : request.File.ContentType, 120),
            SizeBytes = request.File.Length,
            RelativePath = relativePath,
            Url = string.Empty,
            Language = TrimTo(request.Language?.Trim() ?? string.Empty, 20),
            TargetRole = TrimTo(request.TargetRole?.Trim() ?? string.Empty, 160),
            Status = "Active",
            Notes = request.Notes?.Trim() ?? string.Empty,
            Tags = NormalizeTags(request.Tags),
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.UserDocuments.Add(document);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(Download), new { id = document.Id }, MapDocument(document));
    }

    [HttpPost("links")]
    public async Task<ActionResult<DocumentDto>> CreateLink(CreateDocumentLinkRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var name = request.Name?.Trim() ?? string.Empty;
        var url = request.Url?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(url))
        {
            return BadRequest("Name and URL are required.");
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest("Enter a valid http or https URL.");
        }

        var now = DateTime.UtcNow;
        var document = new UserDocument
        {
            AppUserId = userId.Value,
            Name = TrimTo(name, 220),
            Type = TrimTo(string.IsNullOrWhiteSpace(request.Type) ? "Portfolio" : request.Type.Trim(), 80),
            Category = TrimTo(string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(), 100),
            Url = TrimTo(uri.ToString(), 700),
            ContentType = "text/uri-list",
            Status = "Active",
            Notes = request.Notes?.Trim() ?? string.Empty,
            Tags = NormalizeTags(request.Tags),
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.UserDocuments.Add(document);
        await _dbContext.SaveChangesAsync();

        return Ok(MapDocument(document));
    }

    [HttpPost("text")]
    public async Task<ActionResult<DocumentDto>> CreateTextDocument(CreateTextDocumentRequest request, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var name = TrimTo(request.Name?.Trim() ?? string.Empty, 220);
        var content = request.Content?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(content))
        {
            return BadRequest("Document name and content are required.");
        }

        if (content.Length > MaxTextDocumentCharacters)
        {
            return BadRequest("Document content is too long.");
        }

        var documentId = Guid.NewGuid();
        var userFolderName = userId.Value.ToString("N");
        var storedFileName = $"{documentId:N}.txt";
        var relativePath = Path.Combine(userFolderName, storedFileName);
        var absoluteFolder = Path.Combine(GetUploadRoot(), userFolderName);
        var absolutePath = Path.Combine(absoluteFolder, storedFileName);

        Directory.CreateDirectory(absoluteFolder);
        await System.IO.File.WriteAllTextAsync(absolutePath, content, cancellationToken);

        var now = DateTime.UtcNow;
        var document = new UserDocument
        {
            Id = documentId,
            AppUserId = userId.Value,
            Name = name,
            Type = TrimTo(string.IsNullOrWhiteSpace(request.Type) ? "Cover letter" : request.Type.Trim(), 80),
            Category = TrimTo(string.IsNullOrWhiteSpace(request.Category) ? "AI generated" : request.Category.Trim(), 100),
            OriginalFileName = $"{name}.txt",
            StoredFileName = storedFileName,
            ContentType = "text/plain; charset=utf-8",
            SizeBytes = Encoding.UTF8.GetByteCount(content),
            RelativePath = relativePath,
            Url = string.Empty,
            Language = TrimTo(request.Language?.Trim() ?? string.Empty, 20),
            TargetRole = TrimTo(request.TargetRole?.Trim() ?? string.Empty, 160),
            Status = "Active",
            Notes = request.Notes?.Trim() ?? string.Empty,
            Tags = NormalizeTags(request.Tags),
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.UserDocuments.Add(document);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapDocument(document));
    }

    [HttpPut("{id:guid}/archive")]
    public async Task<ActionResult<DocumentDto>> Archive(Guid id)
    {
        if (HttpContext.GetCurrentUserId() is null)
        {
            return Unauthorized();
        }

        var document = await FindCurrentUserDocument(id);

        if (document is null)
        {
            return NotFound();
        }

        document.Status = "Archived";
        document.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(MapDocument(document));
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        if (HttpContext.GetCurrentUserId() is null)
        {
            return Unauthorized();
        }

        var document = await FindCurrentUserDocument(id);

        if (document is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(document.RelativePath))
        {
            return BadRequest("This document is a saved link and cannot be downloaded.");
        }

        var absolutePath = GetSafeDocumentPath(document);

        if (absolutePath is null)
        {
            return BadRequest("Document path is invalid.");
        }

        if (!System.IO.File.Exists(absolutePath))
        {
            return NotFound("The saved file is missing from local storage.");
        }

        return PhysicalFile(absolutePath, document.ContentType, document.OriginalFileName);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (HttpContext.GetCurrentUserId() is null)
        {
            return Unauthorized();
        }

        var document = await FindCurrentUserDocument(id);

        if (document is null)
        {
            return NotFound();
        }

        var absolutePath = GetSafeDocumentPath(document);

        _dbContext.UserDocuments.Remove(document);
        await _dbContext.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(absolutePath) && System.IO.File.Exists(absolutePath))
        {
            System.IO.File.Delete(absolutePath);
        }

        return NoContent();
    }

    private Task<UserDocument?> FindCurrentUserDocument(Guid id)
    {
        var userId = HttpContext.GetCurrentUserId();

        return userId is null
            ? Task.FromResult<UserDocument?>(null)
            : _dbContext.UserDocuments.FirstOrDefaultAsync(x => x.Id == id && x.AppUserId == userId.Value);
    }

    private string GetUploadRoot()
    {
        return Path.Combine(_environment.ContentRootPath, "App_Data", "uploads");
    }

    private string? GetSafeDocumentPath(UserDocument document)
    {
        if (string.IsNullOrWhiteSpace(document.RelativePath))
        {
            return null;
        }

        var uploadRoot = Path.GetFullPath(GetUploadRoot());
        var absolutePath = Path.GetFullPath(Path.Combine(uploadRoot, document.RelativePath));
        var rootWithSeparator = uploadRoot.EndsWith(Path.DirectorySeparatorChar)
            ? uploadRoot
            : $"{uploadRoot}{Path.DirectorySeparatorChar}";

        return absolutePath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase)
            ? absolutePath
            : null;
    }

    private static string InferDocumentType(string fileName)
    {
        var normalized = fileName.ToLowerInvariant();

        if (normalized.Contains("cover") || normalized.Contains("letter") || normalized.Contains("motyw"))
        {
            return "Cover letter";
        }

        if (normalized.Contains("cv") || normalized.Contains("resume"))
        {
            return "CV";
        }

        return "Other";
    }

    private static string FormatSize(long bytes)
    {
        if (bytes <= 0)
        {
            return "URL";
        }

        if (bytes < 1024 * 1024)
        {
            return $"{Math.Max(1, bytes / 1024)} KB";
        }

        return $"{bytes / 1024d / 1024d:0.0} MB";
    }

    private static string NormalizeTags(string? tags)
    {
        if (string.IsNullOrWhiteSpace(tags))
        {
            return string.Empty;
        }

        return string.Join(", ", tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private static string TrimTo(string value, int maxLength)
    {
        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private static DocumentDto MapDocument(UserDocument document, int usedIn = 0)
    {
        var tags = string.IsNullOrWhiteSpace(document.Tags)
            ? Array.Empty<string>()
            : document.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return new DocumentDto(
            document.Id,
            document.Name,
            document.Type,
            document.Category,
            document.UpdatedAt.ToString("yyyy-MM-dd"),
            usedIn,
            FormatSize(document.SizeBytes),
            document.Url,
            string.IsNullOrWhiteSpace(document.Language) ? null : document.Language,
            string.IsNullOrWhiteSpace(document.TargetRole) ? null : document.TargetRole,
            string.IsNullOrWhiteSpace(document.OriginalFileName) ? null : document.OriginalFileName,
            document.CreatedAt.ToString("O"),
            document.UpdatedAt.ToString("O"),
            usedIn,
            Array.Empty<Guid>(),
            tags,
            document.Status,
            string.IsNullOrWhiteSpace(document.Notes) ? null : document.Notes,
            document.SuccessRate,
            document.LastUsedAt?.ToString("yyyy-MM-dd"),
            document.IsDefault);
    }
}

public sealed class UploadDocumentRequest
{
    public IFormFile? File { get; set; }

    public string? Name { get; set; }

    public string? Type { get; set; }

    public string? Category { get; set; }

    public string? Language { get; set; }

    public string? TargetRole { get; set; }

    public string? Notes { get; set; }

    public string? Tags { get; set; }
}

public sealed class CreateDocumentLinkRequest
{
    public string Name { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public string? Tags { get; set; }
}

public sealed class CreateTextDocumentRequest
{
    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = "Cover letter";

    public string Category { get; set; } = "AI generated";

    public string Content { get; set; } = string.Empty;

    public string? Language { get; set; }

    public string? TargetRole { get; set; }

    public string? Notes { get; set; }

    public string? Tags { get; set; }
}

public record DocumentDto(
    Guid Id,
    string Name,
    string Type,
    string Category,
    string Updated,
    int UsedIn,
    string Size,
    string Url,
    string? Language,
    string? TargetRole,
    string? FileName,
    string CreatedAt,
    string UpdatedAt,
    int UsedInApplicationsCount,
    Guid[] AssignedApplications,
    string[] Tags,
    string Status,
    string? Notes,
    int SuccessRate,
    string? LastUsedAt,
    bool IsDefault);
