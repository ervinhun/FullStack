using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using StateleSSE.AspNetCore;

public class RealtimeController(ISseBackplane backplane) : ControllerBase
{
    // Note: This is a temporary in-memory store for demonstration purposes.
    // In a real application, you should use a proper database.
    private static readonly List<DmMessageResponse> _dmStore = new();
    private Dictionary<string, DateTime> activeUsers = new();

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
    public async Task Send(string room, string message, string from)
    {
        await backplane.Clients.SendToGroupAsync(room, new MessageResponse(message, room, from, DateTime.UtcNow));
    }

    [HttpPost("poke")]
    [Produces<PokeResponse>]
    public async Task<IActionResult> Poke(string from, string toId)
    {
        await backplane.Clients.SendToClientAsync(toId, new PokeResponse(from, toId, DateTime.UtcNow));
        return Ok(new PokeResponse(from, toId, DateTime.UtcNow));
    }

    [HttpPost("leave")]
    public async Task Leave(string roomId, string connectionId)
    {
        await backplane.Groups.RemoveFromGroupAsync(connectionId, roomId);
    }
    
    [HttpPost("dm")]
    [ProducesResponseType(typeof(DmMessageResponse), 200)]
    public async Task<IActionResult> SendDm(string from, string to, string message)
    {
        var dm = new DmMessageResponse(from, to, message, false, DateTime.UtcNow);
        _dmStore.Add(dm);
        await backplane.Clients.SendToClientAsync(to, dm);
        return Ok(new DmMessageResponse(from, to, $"You DMd {to}", false, DateTime.UtcNow));
    }

    [HttpPost("readingDm")]
    [ProducesResponseType(typeof(DmMessageResponse), 200)]
    public async Task<IActionResult> ReadDm(string from, string to)
    {
        var messagesToUpdate = _dmStore.Where(dm => dm.From == from && dm.To == to && !dm.Read).ToList();

        foreach (var dm in messagesToUpdate)
        {
            var updatedDm = dm with { Read = true };
            _dmStore.Remove(dm);
            _dmStore.Add(updatedDm);
            
            // Notify both the sender and receiver that the message has been read
            await backplane.Clients.SendToClientAsync(from, updatedDm);
            await backplane.Clients.SendToClientAsync(to, updatedDm);
        }

        return Ok();
    }
}

public record PokeResponse(string From, string To, DateTime Timestamp) : BaseResponseDto;

public record MessageResponse(string Message, string Room, string From, DateTime Timestamp) : BaseResponseDto;
public record DmMessageResponse(string From, string To, string Message, bool Read, DateTime Timestamp) : BaseResponseDto;

public record JoinResponse(string Message, string Who, string Room, DateTime Timestamp) : BaseResponseDto;
public record TypingResponse(string Who, bool isTyping, DateTime Timestamp) : BaseResponseDto;
public record ActiveUsersResponse(string[] users);