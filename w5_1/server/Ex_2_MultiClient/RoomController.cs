using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace ex1;

[ApiController]
[Route("[controller]")]
public class RoomController : ControllerBase
{
    private static readonly ConcurrentDictionary<Stream, byte> Clients = new();
    private static readonly ConcurrentDictionary<string, string> Room = new();

    static RoomController()
    {
        var room1 = "General Chat Room";
        var room2 = "Random Chat Room";
        Room.TryAdd(RoomIdFromName(room1), room1);
        Room.TryAdd(RoomIdFromName(room2), room2);
    }

    [HttpGet("rooms")]
    public async Task GetRooms()
    {
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.ContentType = "text/event-stream";
        Clients.TryAdd(Response.Body, 0);
        foreach (var room in Room)
        {
            var roomInfo = $"{room.Key}: {room.Value}\n";
            await Response.WriteAsync(roomInfo);
            await Response.Body.FlushAsync();
        }

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
     * To test this endpoint, you can use the following curl command:
     * curl.exe -X POST "http://localhost:5208/room/create-room" -H "Content-Type: application/json" -d "\"name:\" \"New Room Name\""
     */
    [HttpPost("create-room")]
    public async Task CreateRoom([FromBody] CreateRoomRequestDto dto)
    {
        Room.TryAdd(RoomIdFromName(dto.Name.Trim()), dto.Name.Trim());
        var roomToAdd = new Room
        {
            Id = RoomIdFromName(dto.Name.Trim()),
            Name = dto.Name.Trim()
        };
        var roomJson = JsonSerializer.Serialize(roomToAdd);
        var roomBytes = Encoding.UTF8.GetBytes($"data: {roomJson}\n\n");

        foreach (var client in Clients.Keys)
        {
            try
            {
                await client.WriteAsync(roomBytes, 0, roomBytes.Length);
                await client.FlushAsync();
            }
            catch
            {
                Clients.TryRemove(client, out _);
            }
        }
    }
    
    private static string RoomIdFromName(string roomName)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(roomName.Trim().ToLower()));

        return Convert.ToHexString(bytes[..16]).ToLower();
    }
}