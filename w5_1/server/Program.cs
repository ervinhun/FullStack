using StateleSSE.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<HostOptions>(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(0); 
});
builder.Services.AddInMemorySseBackplane();
builder.Services.AddControllers();
builder.Services.AddCors();
builder.Services.AddOpenApiDocument();

var app = builder.Build();
app.UseCors(_ => _.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin().SetIsOriginAllowed(_ => true));
app.UseOpenApi();
app.UseSwaggerUi();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.UseOpenApi();
app.UseSwaggerUi();


var backplane = app.Services.GetRequiredService<ISseBackplane>();                                                                                                                         
backplane.OnClientDisconnected += async (_, e) =>                                                                                                                                         
{                                                      
    var message = $"\"left\": \"{e.ConnectionId} has left the chat.\"";
    await backplane.Clients.SendToGroupsAsync(e.Groups, new {message});                                                                                                                                                                     
};    

app.Run();