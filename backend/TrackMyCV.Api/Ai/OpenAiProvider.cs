using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace TrackMyCV.Api.Ai;

public class OpenAiProvider : IAiProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly OpenAiOptions _options;

    public OpenAiProvider(HttpClient httpClient, IOptions<OpenAiOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<TResponse> GenerateStructuredResponseAsync<TResponse>(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new AiProviderException("OpenAI is not configured. Add OPENAI_API_KEY on the backend.");
        }

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Clamp(_options.TimeoutSeconds, 10, 180)));

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Content = JsonContent.Create(new
        {
            model = string.IsNullOrWhiteSpace(_options.Model) ? "gpt-5-mini" : _options.Model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            response_format = new { type = "json_object" }
        }, options: JsonOptions);

        HttpResponseMessage response;

        try
        {
            response = await _httpClient.SendAsync(request, timeout.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new AiProviderException("The AI request timed out. Try again with a shorter job description.");
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new AiProviderException(ToSafeError(response.StatusCode));
        }

        await using var responseStream = await response.Content.ReadAsStreamAsync(timeout.Token);
        var completion = await JsonSerializer.DeserializeAsync<ChatCompletionResponse>(responseStream, JsonOptions, timeout.Token);
        var content = completion?.Choices.FirstOrDefault()?.Message.Content;

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new AiProviderException("The AI response was empty.");
        }

        var cleanJson = StripJsonFence(content);
        TResponse? parsed;

        try
        {
            parsed = JsonSerializer.Deserialize<TResponse>(cleanJson, JsonOptions);
        }
        catch (JsonException)
        {
            throw new AiProviderException("The AI response had an unexpected format. Try again.");
        }

        return parsed ?? throw new AiProviderException("The AI response had an unexpected format.");
    }

    private static string StripJsonFence(string content)
    {
        var clean = content.Trim();

        if (clean.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            clean = clean[7..].Trim();
        }
        else if (clean.StartsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            clean = clean[3..].Trim();
        }

        if (clean.EndsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            clean = clean[..^3].Trim();
        }

        return clean;
    }

    private static string ToSafeError(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.Unauthorized => "OpenAI rejected the API key configured on the backend.",
        HttpStatusCode.Forbidden => "The configured OpenAI account cannot access this model.",
        HttpStatusCode.TooManyRequests => "AI rate limit reached. Try again in a moment.",
        HttpStatusCode.RequestTimeout => "The AI request timed out. Try again.",
        _ => "The AI provider could not complete this request."
    };

    private sealed record ChatCompletionResponse(ChatChoice[] Choices);

    private sealed record ChatChoice(ChatMessage Message);

    private sealed record ChatMessage(string Content);
}

public class AiProviderException : Exception
{
    public AiProviderException(string message)
        : base(message)
    {
    }
}
