namespace TrackMyCV.Api.Ai;

public class OpenAiOptions
{
    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "gpt-5-mini";

    public int TimeoutSeconds { get; set; } = 90;
}
