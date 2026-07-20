namespace TrackMyCV.Api.Notifications;

public interface IEmailSender
{
    bool IsConfigured { get; }

    Task<EmailSendResult> SendAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default);
}

public record EmailSendResult(bool Sent, string Message);
