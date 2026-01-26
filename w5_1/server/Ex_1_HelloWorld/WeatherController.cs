using Microsoft.AspNetCore.Mvc;

namespace ex1;

[ApiController]
[Route("[controller]")]
public class WeatherController : ControllerBase
{
    /// <summary>
    /// Test it with:
    /// curl -N "http://localhost:5208/weather/stream" & sleep 20
    /// </summary>
    [HttpGet("stream")]
    public async Task Stream()
    {
        Response.Headers.ContentType = "text/event-stream";
        while (true)
        {
            await Task.Delay(2000);
            var weatherUpdate = System.Text.Encoding.UTF8.GetBytes($"it is sunny and {new Random().Next()} degrees at {DateTime.Now.ToLocalTime()}\n\n");
            await Response.Body.WriteAsync(weatherUpdate);
            await Response.Body.FlushAsync();
        }
    }
    
    /// <summary>
    /// Test it with:
    /// curl -N "http://localhost:5208/weather/keypress" & sleep 20
    /// </summary>
    [HttpGet("keypress")]
    public async Task Keypress()
    {
        Response.Headers.ContentType = "text/event-stream";
        while (true)
        {
            var line = Console.ReadLine();
            var message = System.Text.Encoding.UTF8.GetBytes($"data: {line}\n\n");
            await Response.Body.WriteAsync(message);
            await Response.Body.FlushAsync();
        }
    }
}