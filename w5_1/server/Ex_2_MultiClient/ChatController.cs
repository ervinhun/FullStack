using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace ex1;

[ApiController]
[Route("[controller]")]
public class ChatController : ControllerBase
{
    private static readonly List<System.IO.Stream> Clients = new();


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
        Clients.Add(Response.Body);
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
            Clients.Remove(Response.Body);
        }
    }


    /**
    How to test: First let some client connect to the stream endpoint above, then send a message to this one with:
    
    curl -X POST http://localhost:5208/chat/send \
    -H "Content-Type: application/json" \
    -d '{"Content":"Hello from curl!","GroupId":"room1"}'
    
    curl.exe -X POST http://localhost:5208/chat/send -H "Content-Type: application/json" -d '{"Content":"Hello from curl!"}'
    
    curl.exe -X POST http://localhost:5208/chat/send -H "Content-Type: application/json" -d '@payload.json'
     */
    [HttpPost("send")]
    public async Task SendMessage([FromBody] Message message)
    {
        message.Timestamp = DateTime.UtcNow;
        var messageJson = System.Text.Json.JsonSerializer.Serialize(message);
        var messageBytes = Encoding.UTF8.GetBytes($"data: {messageJson}\n\n");

        foreach (var client in Clients)
        {
            try
            {
                await client.WriteAsync(messageBytes);
                await client.FlushAsync();
            }
            catch
            {
                Clients.Remove(client);
            }
        }
    }
}