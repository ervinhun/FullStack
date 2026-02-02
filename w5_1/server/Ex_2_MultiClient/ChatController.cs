using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace ex1;

[ApiController]
[Route("[controller]")]
public class ChatController : ControllerBase
{
    //private static readonly List<System.IO.Stream> Clients = new();
    private static readonly ConcurrentDictionary<Stream, byte> Clients = new();

    private static readonly ConcurrentDictionary<string, DateTime> TypingUsers = new();
    private static readonly Timer _cleanupTimer;

    static ChatController()
    {
        // Run the cleanup task every 5 seconds
        _cleanupTimer = new Timer(CleanupOldTypingUsers, null, TimeSpan.Zero, TimeSpan.FromSeconds(5));
    }

    private static void CleanupOldTypingUsers(object? state)
    {
        var usersChanged = false;
        var now = DateTime.UtcNow;
        var timeout = TimeSpan.FromSeconds(15);

        foreach (var user in TypingUsers.ToList())
        {
            if (now - user.Value > timeout)
            {
                if (TypingUsers.TryRemove(user.Key, out _))
                {
                    usersChanged = true;
                }
            }
        }

        if (usersChanged)
        {
            _ = BroadcastTypingUsers();
        }
    }


    /// <summary>
    /// how to test this: Connect to the stream with:
    /// curl -N "http://localhost:5208/chat/stream" & sleep 20
    ///
    /// and then send the message with the other controller endpoint
    /// </summary>
    [HttpGet("stream")]
    public async Task Stream()
    {
        Response.Headers.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        Response.Headers.Add("X-Accel-Buffering", "no");

        Clients.TryAdd(Response.Body, 0);
        await Response.WriteAsync(":\n\n");
        await Response.Body.FlushAsync();
        try
        {
            while (!HttpContext.RequestAborted.IsCancellationRequested)
            {
                await Task.Delay(1000);
            }
        }
        finally
        {
            Clients.TryRemove(Response.Body, out _);
        }
    }


    /**
    How to test: First let some client connect to the stream endpoint above, then send a message to this one with:

    curl -X POST http://localhost:5208/chat/send \
    -H "Content-Type: application/json" \
    -d '{"Content":"Hello from curl!","GroupId":"room1"}'

    curl.exe -X POST http://localhost:5208/chat/send -H "Content-Type: application/json" -d "{\"Content\":\"Hello from curl!\",\"Sender\":\"Bob\"}"
    -d "{\"Sender\":\"Alice\",\"GroupId\":\"room1\",\"IsTyping\":true}"
    curl.exe -X POST http://localhost:5208/chat/send -H "Content-Type: application/json" -d '@payload.json'
     */
    [HttpPost("send")]
    public async Task SendMessage([FromBody] Message message)
    {
        message.Timestamp = DateTime.UtcNow;
        message.GroupId = "general";
        var messageJson = JsonSerializer.Serialize(message);
        var messageBytes = Encoding.UTF8.GetBytes($"data: {messageJson}\n\n");

        foreach (var client in Clients.Keys)
        {
            try
            {
                await client.WriteAsync(messageBytes);
                await client.FlushAsync();
            }
            catch
            {
                Clients.TryRemove(client, out _);
            }
        }
    }

    /*
    How to test: First let some client connect to the stream endpoint above, then send a typing notification to this one with:
    curl.exe -X POST http://localhost:5208/chat/typing -H "Content-Type: application/json" -d "{\"Sender\":\"Alice\",\"GroupId\":\"room1\",\"IsTyping\":true}"

     */

    [HttpPost("typing")]
    public async Task SendTypingNotification([FromBody] Typing typing)
    {
        if (typing.IsTyping)
        {
            TypingUsers.AddOrUpdate(typing.Sender, DateTime.UtcNow, (key, oldValue) => DateTime.UtcNow);
        }
        else
        {
            TypingUsers.TryRemove(typing.Sender, out _);
        }

        await BroadcastTypingUsers();
    }

    private static async Task BroadcastTypingUsers()
    {
        var typingUsersList = TypingUsers.Keys.ToList();
        var typingJson = JsonSerializer.Serialize(typingUsersList);
        var typingBytes = Encoding.UTF8.GetBytes($"event: typing\ndata: {typingJson}\n\n");

        foreach (var client in Clients.Keys)
        {
            try
            {
                await client.WriteAsync(typingBytes);
                await client.FlushAsync();
            }
            catch
            {
                Clients.TryRemove(client, out _);
            }
        }
    }
}