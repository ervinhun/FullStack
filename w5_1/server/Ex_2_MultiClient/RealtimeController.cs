using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using StateleSSE.AspNetCore;

namespace ex1.Ex_2_MultiClient;

public class RealtimeController(ISseBackplane backplane) : ControllerBase
{
    [HttpGet("connect")]
    public async Task Connect()
    {
        await using var sse = await HttpContext.OpenSseStreamAsync();
        await using var connection = backplane.CreateConnection();

        await sse.WriteAsync("connected", JsonSerializer.Serialize(new { connection.ConnectionId },
            new JsonSerializerOptions()
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));

        await foreach (var evt in connection.ReadAllAsync(HttpContext.RequestAborted))
            await sse.WriteAsync(evt.Group ?? "message", evt.Data);
    }
    
    [HttpGet("poked")]
    public async Task Poked()
    {
        await using var sse = await HttpContext.OpenSseStreamAsync();
        await using var connection = backplane.CreateConnection();

        await sse.WriteAsync("connected", JsonSerializer.Serialize(new { connection.ConnectionId },
            new JsonSerializerOptions()
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));

        await foreach (var evt in connection.ReadAllAsync(HttpContext.RequestAborted))
            await sse.WriteAsync(evt.Group ?? "poke", evt.Data);
    }

    [HttpPost("join")]
    public async Task Join(string connectionId, string room)
    {
        var message = $"\"joined\": \"{connectionId} joined\"";
        await backplane.Groups.AddToGroupAsync(connectionId, room);
        await backplane.Clients.SendToGroupAsync(room, new { message });
    }

    [HttpPost("send")]
    public async Task Send(string room, string message)
        => await backplane.Clients.SendToGroupAsync(room, new { message });
    
    [HttpPost("poke")]
    public async Task Poke(string connectionId, string room)
        => await backplane.Clients.SendToClientAsync(room, connectionId + " - poked");
}