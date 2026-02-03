import {useEffect, useRef, useState} from 'react';
import type {MessageResponse} from "../../generated-ts-client.ts";
import {useStream} from "../../helpers/useStream.tsx";

type Props = {
    messages: MessageResponse[];
    currentUser: string;
};

export function ChatArea({ messages, currentUser }: Props) {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const stream = useStream()
    const streamRef = useRef(stream)
    const [bubble, setBubble] = useState<MessageResponse[]>([]);
    const roomId = "123"
    useEffect(() => {
        const s = streamRef.current;
        s.on<MessageResponse>(roomId, "MessageResponse", (dto) => {
            setBubble(prev => [...prev, dto]);
        });
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-base-200 rounded-lg">
        {bubble.map((msg, i) => {
                const isMe = msg.from === currentUser;
                return (
                    <div key={i} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                        <div className="chat-header">{isMe ? 'Me' :msg.from}</div>
                        <div className={`chat-bubble ${isMe ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
                            {msg.message}
                        </div>
                        <div className="chat-footer opacity-50">
                            {new Date(msg.timestamp!).toLocaleTimeString()}
                            {isMe && ' ✓✓'}
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
