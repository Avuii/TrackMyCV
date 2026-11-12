using System.Net;
using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TrackMyCV.Api.Notifications;
using Xunit;

namespace TrackMyCV.Tests;

public sealed class SmtpTransportTests
{
    [Fact]
    public async Task SenderDeliversMessageToLocalSmtpReceiver()
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var sender = new SmtpEmailSender(Options.Create(new EmailOptions
        {
            Enabled = true,
            Host = "127.0.0.1",
            Port = ((IPEndPoint)listener.LocalEndpoint).Port,
            EnableSsl = false,
            FromEmail = "sender@example.test"
        }), NullLogger<SmtpEmailSender>.Instance);

        var receive = ReceiveMessage(listener, timeout.Token);
        var result = await sender.SendAsync("recipient@example.test", "Follow up: Example", "Check for a reply.", timeout.Token);
        Assert.True(result.Sent, result.Message);

        var message = await receive;
        Assert.Contains(message, line => line.StartsWith("MAIL FROM:<sender@example.test>", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(message, line => line.StartsWith("RCPT TO:<recipient@example.test>", StringComparison.OrdinalIgnoreCase));
        Assert.Contains("Subject: Follow up: Example", message);
        Assert.Contains("Check for a reply.", message);
    }

    private static async Task<List<string>> ReceiveMessage(TcpListener listener, CancellationToken cancellationToken)
    {
        using var client = await listener.AcceptTcpClientAsync(cancellationToken);
        using var stream = client.GetStream();
        using var reader = new StreamReader(stream, Encoding.ASCII, leaveOpen: true);
        await using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true)
        {
            AutoFlush = true, NewLine = "\r\n"
        };

        await writer.WriteLineAsync("220 TrackMyCV test receiver");
        var lines = new List<string>();
        while (await reader.ReadLineAsync(cancellationToken) is { } line)
        {
            lines.Add(line);
            if (line.Equals("DATA", StringComparison.OrdinalIgnoreCase))
            {
                await writer.WriteLineAsync("354 End with a dot");
                while (await reader.ReadLineAsync(cancellationToken) is { } bodyLine && bodyLine != ".")
                    lines.Add(bodyLine);
                await writer.WriteLineAsync("250 Message accepted");
            }
            else if (line.Equals("QUIT", StringComparison.OrdinalIgnoreCase))
            {
                await writer.WriteLineAsync("221 Goodbye");
                break;
            }
            else
            {
                await writer.WriteLineAsync("250 OK");
            }
        }
        return lines;
    }
}
