using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using TrackMyCV.Domain.Entities;

namespace TrackMyCV.Api.Ai;

public class DocumentTextExtractor : IDocumentTextExtractor
{
    private const int MinimumTextLength = 120;
    private readonly IWebHostEnvironment _environment;

    public DocumentTextExtractor(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<ExtractedDocumentText> ExtractTextAsync(UserDocument document, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(document.RelativePath))
        {
            throw new DocumentTextExtractionException("Saved links cannot be analyzed. Upload a PDF or DOCX CV file.");
        }

        var path = GetSafeDocumentPath(document);

        if (path is null || !File.Exists(path))
        {
            throw new DocumentTextExtractionException("The CV file is missing from local storage.");
        }

        var extension = Path.GetExtension(document.OriginalFileName);
        var text = extension.ToLowerInvariant() switch
        {
            ".docx" => ExtractDocx(path),
            ".pdf" => await ExtractPdfAsync(path, cancellationToken),
            ".txt" => await File.ReadAllTextAsync(path, cancellationToken),
            ".rtf" => StripRtf(await File.ReadAllTextAsync(path, cancellationToken)),
            _ => throw new DocumentTextExtractionException("Unsupported CV format. Upload a PDF, DOCX, TXT or RTF file.")
        };

        text = NormalizeWhitespace(text);

        if (text.Length < MinimumTextLength)
        {
            throw new DocumentTextExtractionException("Could not read enough text from this CV. If it is a scanned PDF, upload a text-based PDF or DOCX file.");
        }

        return new ExtractedDocumentText(text, extension.TrimStart('.').ToUpperInvariant());
    }

    private string? GetSafeDocumentPath(UserDocument document)
    {
        var uploadRoot = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "App_Data", "uploads"));
        var absolutePath = Path.GetFullPath(Path.Combine(uploadRoot, document.RelativePath));
        var rootWithSeparator = uploadRoot.EndsWith(Path.DirectorySeparatorChar)
            ? uploadRoot
            : $"{uploadRoot}{Path.DirectorySeparatorChar}";

        return absolutePath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase)
            ? absolutePath
            : null;
    }

    private static string ExtractDocx(string path)
    {
        using var archive = ZipFile.OpenRead(path);
        var entry = archive.GetEntry("word/document.xml")
            ?? throw new DocumentTextExtractionException("This DOCX file does not contain a readable document body.");

        using var stream = entry.Open();
        var document = XDocument.Load(stream);
        XNamespace wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

        return string.Join(" ", document.Descendants(wordNamespace + "t").Select(x => x.Value));
    }

    private static async Task<string> ExtractPdfAsync(string path, CancellationToken cancellationToken)
    {
        var bytes = await File.ReadAllBytesAsync(path, cancellationToken);
        var raw = Encoding.Latin1.GetString(bytes);
        var builder = new StringBuilder();

        foreach (Match streamMatch in Regex.Matches(raw, @"(?s)(?<dict><<.*?>>)\s*stream\r?\n?(?<body>.*?)\r?\n?endstream"))
        {
            var dictionary = streamMatch.Groups["dict"].Value;
            var body = streamMatch.Groups["body"].Value;
            var streamText = dictionary.Contains("/FlateDecode", StringComparison.OrdinalIgnoreCase)
                ? TryInflatePdfStream(body)
                : body;

            AppendPdfText(builder, streamText);
        }

        if (builder.Length == 0)
        {
            AppendPdfText(builder, raw);
        }

        return builder.ToString();
    }

    private static string TryInflatePdfStream(string body)
    {
        try
        {
            var bytes = Encoding.Latin1.GetBytes(body.Trim('\r', '\n'));
            using var source = new MemoryStream(bytes);
            using var zlib = new ZLibStream(source, CompressionMode.Decompress);
            using var reader = new StreamReader(zlib, Encoding.Latin1);
            return reader.ReadToEnd();
        }
        catch
        {
            return body;
        }
    }

    private static void AppendPdfText(StringBuilder builder, string source)
    {
        foreach (Match match in Regex.Matches(source, @"\((?<text>(?:\\.|[^\\)])*)\)"))
        {
            var text = DecodePdfLiteral(match.Groups["text"].Value);
            if (!string.IsNullOrWhiteSpace(text))
            {
                builder.Append(text).Append(' ');
            }
        }

        foreach (Match match in Regex.Matches(source, @"<(?<hex>[0-9A-Fa-f]{4,})>"))
        {
            var text = DecodePdfHex(match.Groups["hex"].Value);
            if (!string.IsNullOrWhiteSpace(text))
            {
                builder.Append(text).Append(' ');
            }
        }
    }

    private static string DecodePdfLiteral(string value)
    {
        return Regex.Replace(value, @"\\([nrtbf\\()])", match => match.Groups[1].Value switch
        {
            "n" => "\n",
            "r" => "\r",
            "t" => "\t",
            "b" => "\b",
            "f" => "\f",
            var item => item
        });
    }

    private static string DecodePdfHex(string value)
    {
        try
        {
            var clean = value.Length % 2 == 0 ? value : $"{value}0";
            var bytes = Enumerable.Range(0, clean.Length / 2)
                .Select(i => Convert.ToByte(clean.Substring(i * 2, 2), 16))
                .ToArray();

            var unicode = Encoding.BigEndianUnicode.GetString(bytes);
            return unicode.Count(ch => !char.IsControl(ch)) > 2 ? unicode : Encoding.Latin1.GetString(bytes);
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string StripRtf(string value)
    {
        var withoutControls = Regex.Replace(value, @"\\'[0-9a-fA-F]{2}|\\[a-zA-Z]+\d* ?", " ");
        return Regex.Replace(withoutControls, @"[{}]", " ");
    }

    private static string NormalizeWhitespace(string value)
    {
        return Regex.Replace(value, @"\s+", " ").Trim();
    }
}

public class DocumentTextExtractionException : Exception
{
    public DocumentTextExtractionException(string message)
        : base(message)
    {
    }
}
