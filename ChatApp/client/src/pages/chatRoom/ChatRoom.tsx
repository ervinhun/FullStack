import {useEffect, useRef, useState} from 'react'
import '../../App.css'
import {
    type DmMessageResponse,
    type JoinResponse,
    type MessageResponse,
    type PokeResponse,
    RealtimeClient
} from "../../generated-ts-client.ts";
import {useStream} from "../../helpers/useStream.tsx";
import {UserSidebar} from "./UserSide.tsx";
import {ChatInput} from "./ChatInput.tsx";
import {TopBar} from "./TopBar.tsx";
import {ShakeContainer} from "./ShakeContainer.tsx";
import {ToastNotifications} from "./ToastNotifications.tsx";
import {ChatArea} from "./ChatArea.tsx";

const realtimeApi = new RealtimeClient("http://localhost:5000")

function ChatRoom() {

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const stream = useStream()
    const [messages, setMessages] = useState<MessageResponse[]>([{ from: 'System', message: 'Hello!', timestamp: new Date().toISOString() }])
    const [, setDmMessages] = useState<DmMessageResponse[]>([])
    //const [recipientId, setRecipientId] = useState<string>("")
    const [activeUsers] = useState(["Józsika", "Ferike", "Gabika"])
    const [notification, setNotification] = useState<string>();
    const [shaking, setShaking] = useState(false)
    const roomId = "123";

    useEffect(() => {
        stream.on<MessageResponse>(roomId, "MessageResponse", (dto) => {
            setMessages((prev) => [...prev, dto])
        })
        stream.on<PokeResponse>("poke", "PokeResponse", (dto) => {
            //do something here
            setShaking(true)
            setNotification(`${dto.from} poked you 👈`);
            setTimeout(() =>
                setShaking(false), 500);
        })
        stream.on<JoinResponse>(roomId, "JoinResponse", (dto) => {
            if (dto.who !== stream.connectionId)
                setNotification(`${dto.who} joined the room`)
        })
        stream.on<DmMessageResponse>("dm", "DmMessageResponse", (dto) => {
            setNotification(`DM from ${dto.from}: ${dto.message}`)
            setDmMessages((prev) => [...prev, dto])
        })
    }, [stream]);

    useEffect(() => {
        if (!notification) return;
        const t = setTimeout(() => setNotification(undefined), 3000);
        return () => clearTimeout(t);
    }, [notification]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function sendMessage(message: string) {
        realtimeApi.send(roomId, message, stream.connectionId!);
    }

    function pokeUser(userId: string) {
        realtimeApi.poke(stream.connectionId!, userId);
    }

    function leaveRoom() {
        realtimeApi.leave(roomId, stream.connectionId!);
    }


    return (
        <ShakeContainer shaking={shaking}>
            <div className="h-screen flex flex-col">

                {/* TOP BAR */}
                <TopBar
                    roomName={`Room ${roomId}`}
                    dmCount={0}
                    onLeave={leaveRoom}
                />

                {/* MAIN AREA */}
                <div className="flex flex-1 overflow-hidden">

                    {/* CHAT COLUMN */}
                    <div className="flex flex-col flex-1 p-4 overflow-hidden">

                        {/* CHAT MESSAGES */}
                        <div className="grow overflow-y-auto">
                            <ChatArea
                                messages={messages}
                                currentUser={stream.connectionId ?? ''}
                            />
                        </div>

                        {/* INPUT (STAYS AT BOTTOM) */}
                        <div className="pt-3">
                            <ChatInput onSend={sendMessage} />
                        </div>
                        <button disabled={!stream.isConnected} onClick={() => {
                            realtimeApi.join(stream.connectionId!, "123").then(r => {
                                //setState()
                                console.log("Joined " + r.message)
                            })
                        }}>join a room
                        </button>
                    </div>

                    {/* SIDEBAR */}
                    <UserSidebar
                        users={activeUsers}
                        onPoke={pokeUser}
                    />
                </div>

                <ToastNotifications message={notification} />
            </div>
        </ShakeContainer>
    )
}

export default ChatRoom
