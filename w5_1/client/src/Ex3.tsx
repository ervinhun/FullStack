import {useState, useEffect, useRef} from 'react';

// Define the structure of a message, matching our C# backend
interface Message {
    Content: string;
    Sender: string;
    Timestamp: string; // Received as a string
}

// For simplicity, we'll assign a random ID to this user
const currentUser = `User_${Math.random().toString(36).substring(2, 9)}`;

export default function Ex3() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [typings, setTypings] = useState<string[]>([]);
    const typingTimeout = useRef<number | null>(null);
    const [groupId, setGroupId] = useState<string | null>(null);

    // Effect for listening to server-sent events
    useEffect(() => {
        const es = new EventSource("http://localhost:5208/chat/stream");

        es.addEventListener("typing", (event) => {
            const users: string[] = JSON.parse(event.data);
            setTypings(() => users.filter(u =>
                u !== currentUser));
        });

        es.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            setMessages(prev => [...prev, receivedMessage]);
            setGroupId(receivedMessage.groupId);
        };

        return () => {
            es.close();
        };
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        fetch('http://localhost:5208/chat/send', {
            method: "POST",
            body: JSON.stringify({
                Content: newMessage,
                GroupId: groupId ?? "general",
                Sender: currentUser,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        setNewMessage(""); // Clear the input field after sending
    };

    const sendTyping = (isTyping: boolean) => {
        fetch("http://localhost:5208/chat/typing", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                Sender: currentUser,
                GroupId: groupId ?? "general",
                IsTyping: isTyping,
            }),
        });
    };


    return (
        <div className="p-4 h-screen flex flex-col">
            <h1 className="text-2xl font-bold mb-4">Chat Room - You are: <span
                className="text-primary">{currentUser}</span></h1>
            <div className="flex-grow overflow-y-auto p-4 bg-base-200 rounded-lg">
                {messages.map((msg, index) => {
                    const isCurrentUser = msg.Sender === currentUser;
                    const chatAlignment = isCurrentUser ? "chat-end" : "chat-start";
                    const bubbleColor = isCurrentUser ? "chat-bubble-primary" : "chat-bubble-secondary";

                    return (
                        <div key={index} className={`chat ${chatAlignment}`}>
                            <div className="chat-header">
                                {msg.Sender}
                            </div>
                            <div className={`chat-bubble ${bubbleColor}`}>{msg.Content}</div>
                            <div className="chat-footer opacity-50 flex items-center gap-1">
                                {new Date(msg.Timestamp).toLocaleTimeString()}
                                {/* Simple delivered checkmark */}
                                {isCurrentUser && '✓✓'}
                            </div>
                        </div>
                    );
                })}
            </div>
            {typings.length > 0 && (
                <div className="mb-2 text-sm text-base-content/70 italic">
                    {typings.length === 1
                        ? `${typings[0]} is typing…`
                        : `${typings.join(", ")} are typing…`}
                </div>
            )
            }
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);

                        // User is typing
                        sendTyping(true);

                        // Reset stop-typing timer
                        if (typingTimeout.current) {
                            clearTimeout(typingTimeout.current);
                        }

                        typingTimeout.current = window.setTimeout(() => {
                            sendTyping(false);
                        }, 1500);
                    }}
                    className="input input-bordered flex-grow"
                    placeholder="Type a message..."
                />

                <button type="submit" className="btn btn-primary">Send</button>
            </form>
        </div>
    );
}