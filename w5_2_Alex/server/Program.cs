

using server;
using StackExchange.Redis;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<HostOptions>(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(0); 
});
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var config = ConfigurationOptions.Parse("localhost:6379");
    config.AbortOnConnectFail = false;
    return ConnectionMultiplexer.Connect(config);
});

builder.Services.AddRedisSseBackplane();builder.Services.AddControllers();
builder.Services.AddOpenApiDocument(config =>
{
    
});
builder.Services.AddCors();

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.UseOpenApi();
app.UseSwaggerUi();
app.UseCors(conf => conf.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin().SetIsOriginAllowed(_ => true));
app.GenerateApiClientsFromOpenApi("../client/src/generated-ts-client.ts", "./openapi.json").GetAwaiter().GetResult();

app.Run();