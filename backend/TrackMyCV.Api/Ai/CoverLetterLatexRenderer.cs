using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.Text;

namespace TrackMyCV.Api.Ai;

public interface ICoverLetterLatexRenderer
{
    Task<CoverLetterPdfRenderResult> RenderAsync(CoverLetterPdfRenderRequest request, CancellationToken cancellationToken);
}

public record CoverLetterPdfRenderRequest(
    string CoverLetter,
    string CompanyName,
    string JobTitle,
    string Language,
    CoverLetterCandidateInfo Candidate);

public record CoverLetterPdfRenderResult(
    string LatexSource,
    string PdfBase64,
    string[] Warnings);

public class CoverLetterLatexRenderer : ICoverLetterLatexRenderer
{
    private const int CompilerTimeoutSeconds = 35;

    public async Task<CoverLetterPdfRenderResult> RenderAsync(CoverLetterPdfRenderRequest request, CancellationToken cancellationToken)
    {
        var latexSource = BuildLatexSource(request);
        var compiler = Environment.GetEnvironmentVariable("LATEX_COMPILER");

        if (string.IsNullOrWhiteSpace(compiler))
        {
            compiler = "pdflatex";
        }

        var pdfBytes = await CompileAsync(latexSource, compiler, cancellationToken);

        return new CoverLetterPdfRenderResult(
            latexSource,
            Convert.ToBase64String(pdfBytes),
            Array.Empty<string>());
    }

    private static async Task<byte[]> CompileAsync(string latexSource, string compiler, CancellationToken cancellationToken)
    {
        var workDir = Path.Combine(Path.GetTempPath(), "TrackMyCV", "cover-letter", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(workDir);

        try
        {
            var texPath = Path.Combine(workDir, "cover-letter.tex");
            var pdfPath = Path.Combine(workDir, "cover-letter.pdf");
            await File.WriteAllTextAsync(texPath, latexSource, new UTF8Encoding(false), cancellationToken);

            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(CompilerTimeoutSeconds));

            var output = new StringBuilder();
            var processStartInfo = new ProcessStartInfo
            {
                FileName = compiler,
                WorkingDirectory = workDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            processStartInfo.ArgumentList.Add("-interaction=nonstopmode");
            processStartInfo.ArgumentList.Add("-halt-on-error");
            processStartInfo.ArgumentList.Add("-output-directory");
            processStartInfo.ArgumentList.Add(workDir);
            processStartInfo.ArgumentList.Add(texPath);

            using var process = new Process { StartInfo = processStartInfo };
            process.OutputDataReceived += (_, eventArgs) => { if (eventArgs.Data is not null) output.AppendLine(eventArgs.Data); };
            process.ErrorDataReceived += (_, eventArgs) => { if (eventArgs.Data is not null) output.AppendLine(eventArgs.Data); };

            try
            {
                process.Start();
            }
            catch (Win32Exception exception)
            {
                throw new CoverLetterRenderException("LaTeX compiler was not found. Install MiKTeX or TeX Live and make pdflatex available in PATH, or set LATEX_COMPILER.", exception);
            }

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            await process.WaitForExitAsync(timeout.Token);

            if (process.ExitCode != 0 || !File.Exists(pdfPath))
            {
                throw new CoverLetterRenderException($"LaTeX could not compile the cover letter. {Tail(output.ToString())}");
            }

            return await File.ReadAllBytesAsync(pdfPath, cancellationToken);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new CoverLetterRenderException("LaTeX rendering timed out. Try a shorter cover letter.");
        }
        finally
        {
            TryDeleteDirectory(workDir);
        }
    }

    private static string BuildLatexSource(CoverLetterPdfRenderRequest request)
    {
        var language = request.Language.Equals("pl", StringComparison.OrdinalIgnoreCase) ? "pl" : "en";
        var candidate = request.Candidate;
        var title = language == "pl" ? "List motywacyjny" : "Cover letter";
        var closing = language == "pl" ? "Z poważaniem," : "Sincerely,";
        var date = FormatDate(candidate.Location, language);
        var headline = BuildHeadline(candidate);
        var links = BuildLinks(candidate);
        var linksSuffix = string.IsNullOrWhiteSpace(links) ? string.Empty : "\\\\\n" + links;
        var latexLanguage = language == "pl" ? "polish" : "english";
        var candidateName = EscapeLatex(candidate.FullName);
        var dateText = EscapeLatex(date);
        var titleText = EscapeLatex(title);
        var closingText = EscapeLatex(closing);
        var body = BuildBody(request.CoverLetter);

        return $$$"""
\documentclass[11pt,a4paper]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[polish,english]{babel}
\usepackage[a4paper,margin=2.2cm]{geometry}
\usepackage{microtype}
\usepackage{setspace}
\usepackage{parskip}
\usepackage[hidelinks]{hyperref}
\usepackage{lmodern}
\usepackage{graphicx}
\IfFileExists{aurical.sty}{
  \usepackage{aurical}
  \newcommand{\signaturefont}[1]{\rotatebox{2}{\fontfamily{augie}\fontsize{12}{12}\selectfont #1}}
}{
  \newcommand{\signaturefont}[1]{\textit{\large #1}}
}

\setstretch{1.08}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.72em}

\begin{document}
\selectlanguage{{{{latexLanguage}}}}

{\LARGE\bfseries {{{candidateName}}}}\\[0.25em]
\normalsize
{{{headline}}}{{{linksSuffix}}}

\vspace{1.4em}

\begin{flushright}
{{{dateText}}}
\end{flushright}

\vspace{0.6em}

{\Large\bfseries {{{titleText}}}}

{{{body}}}

\vspace{1.2em}

\begin{flushright}
{{{closingText}}}\\[1em]
\signaturefont{{{{candidateName}}}}
\end{flushright}

\end{document}
""";
    }

    private static string BuildHeadline(CoverLetterCandidateInfo candidate)
    {
        var parts = new[] { candidate.Location, candidate.Headline }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(EscapeLatex)
            .ToArray();

        return parts.Length > 0 ? string.Join(@" \textbar\ ", parts) : string.Empty;
    }

    private static string BuildLinks(CoverLetterCandidateInfo candidate)
    {
        var links = new List<string>();

        AddLink(links, "Portfolio", candidate.PortfolioUrl);
        AddLink(links, "LinkedIn", candidate.LinkedInUrl);
        AddLink(links, "GitHub", candidate.GitHubUrl);

        return string.Join(@" \textbar\ ", links);
    }

    private static void AddLink(List<string> links, string label, string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return;
        }

        links.Add(@$"\href{{{EscapeLatexUrl(url.Trim())}}}{{{EscapeLatex(label)}}}");
    }

    private static string BuildBody(string coverLetter)
    {
        var cleaned = StripSignature(coverLetter)
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Trim();

        var paragraphs = cleaned
            .Split("\n\n", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(paragraph => string.Join(" ", paragraph.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)))
            .Where(paragraph => !string.IsNullOrWhiteSpace(paragraph))
            .Select(EscapeLatex);

        return string.Join("\n\n", paragraphs);
    }

    private static string StripSignature(string coverLetter)
    {
        var lines = coverLetter.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n').ToList();

        for (var index = lines.Count - 1; index >= 0; index--)
        {
            var normalized = lines[index].Trim().ToLowerInvariant();

            if (normalized is "z poważaniem," or "z poważaniem" or "sincerely," or "sincerely" or "kind regards," or "kind regards")
            {
                return string.Join('\n', lines.Take(index)).Trim();
            }
        }

        return coverLetter;
    }

    private static string FormatDate(string location, string language)
    {
        var today = DateTime.Now;
        var date = language == "pl"
            ? today.ToString("d MMMM yyyy", CultureInfo.GetCultureInfo("pl-PL"))
            : today.ToString("MMMM d, yyyy", CultureInfo.InvariantCulture);

        return string.IsNullOrWhiteSpace(location) ? date : $"{location.Trim()}, {date}";
    }

    private static string EscapeLatex(string value)
    {
        var builder = new StringBuilder(value.Length);

        foreach (var character in value)
        {
            builder.Append(character switch
            {
                '\\' => @"\textbackslash{}",
                '&' => @"\&",
                '%' => @"\%",
                '$' => @"\$",
                '#' => @"\#",
                '_' => @"\_",
                '{' => @"\{",
                '}' => @"\}",
                '~' => @"\textasciitilde{}",
                '^' => @"\textasciicircum{}",
                _ => character.ToString()
            });
        }

        return builder.ToString();
    }

    private static string EscapeLatexUrl(string value) =>
        value
            .Replace("\\", "/")
            .Replace("%", "\\%")
            .Replace("#", "\\#")
            .Replace("{", "\\{")
            .Replace("}", "\\}");

    private static string Tail(string value)
    {
        var clean = value.Replace("\r\n", "\n").Trim();

        if (clean.Length <= 700)
        {
            return clean;
        }

        return clean[^700..];
    }

    private static void TryDeleteDirectory(string path)
    {
        try
        {
            if (Directory.Exists(path))
            {
                Directory.Delete(path, recursive: true);
            }
        }
        catch
        {
            // Temporary LaTeX artifacts should not block the request.
        }
    }
}

public class CoverLetterRenderException : Exception
{
    public CoverLetterRenderException(string message)
        : base(message)
    {
    }

    public CoverLetterRenderException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
