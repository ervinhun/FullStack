namespace ex1;

public class Message
{
    public required string Content { get; set; }
    public required string Sender { get; set; }
    public string GroupId { get; set; }
    public DateTime Timestamp { get; set; }
}