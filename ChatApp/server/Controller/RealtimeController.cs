using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using StateleSSE.AspNetCore;

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

    [HttpPost("join")]
    [Produces<JoinResponse>]
    public async Task<IActionResult> Join(string connectionId, string room)
    {
        await backplane.Groups.AddToGroupAsync(connectionId, room);
        await backplane.Clients.SendToGroupAsync(room, new JoinResponse($"{connectionId} has entered room {room}", "System", room, DateTime.UtcNow));
        return Ok(new JoinResponse($"You have joined room {room}", "System", room, DateTime.UtcNow));
    }

    [HttpPost("send")]
    [Produces<MessageResponse>]
    public async Task Send(string room, string message)
    {
        await backplane.Clients.SendToGroupAsync(room, new MessageResponse(message, room, "Test", DateTime.UtcNow));
    }

    [HttpPost("poke")]
    [Produces<PokeResponse>]
    public async Task Poke(string connectionId)
    {
        await backplane.Clients.SendToClientAsync(connectionId, new PokeResponse("you have been poked", "Ervin", "Anyu", DateTime.UtcNow));
    }

    [HttpPost("leave")]
    public async Task Leave(string roomId, string connectionId)
    {
        await backplane.Groups.RemoveFromGroupAsync(connectionId, roomId);
    }
    
    
    
}

public record PokeResponse(string Message, string From, string To, DateTime Timestamp) : BaseResponseDto;

public record MessageResponse(string Message, string Room, string From, DateTime Timestamp) : BaseResponseDto;
public record DmMessageResponse(string From, string To, string Message, bool Read, DateTime Timestamp) : BaseResponseDto;

public record JoinResponse(string Message, string Who, string Room, DateTime Timestamp) : BaseResponseDto;
public record TypingResponse(string Who, bool isTyping, DateTime Timestamp) : BaseResponseDto;