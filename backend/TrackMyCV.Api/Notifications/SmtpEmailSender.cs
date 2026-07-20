using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace TrackMyCV.Api.Notifications;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured =>
        _options.Enabled &&
        !string.IsNullOrWhiteSpace(_options.Host) &&
        !string.IsNullOrWhiteSpace(_options.FromEmail);

    public async Task<EmailSendResult> SendAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            return new EmailSendResult(false, "SMTP is not configured. Add Email settings for the TrackMyCV sender account.");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromEmail, _options.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };
        message.To.Add(new MailAddress(recipientEmail));

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            return new EmailSendResult(true, "Email sent.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Could not send TrackMyCV email to {RecipientEmail}.", recipientEmail);
            return new EmailSendResult(false, "The email could not be sent. Check SMTP settings and try again.");
        }
    }
}
