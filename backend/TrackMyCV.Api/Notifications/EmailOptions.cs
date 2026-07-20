namespace TrackMyCV.Api.Notifications;

public class EmailOptions
{
    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public bool EnableSsl { get; set; } = true;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromEmail { get; set; } = "notifications@trackmycv.local";

    public string FromName { get; set; } = "TrackMyCV";
}
