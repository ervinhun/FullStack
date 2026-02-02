import {useEffect, useState} from 'react'
import './App.css'
import {type MessageResponse, type PokeResponse, RealtimeClient} from "./generated-ts-client.ts";
import {useStream} from "./useStream.tsx";

const realtimeApi = new RealtimeClient("http://localhost:5000")

function App() {

    const stream = useStream();
    const [messages, setMessages] = useState<MessageResponse[]>([])

    useEffect(() => {
        stream.on<MessageResponse>("chat/123", "MessageResponse", (dto) => {
            alert("someone sent a message: " + dto.message)
            setMessages((prev) => [...prev, dto])
        })
        stream.on<PokeResponse>("chat/123", "PokeResponse", (dto) => {
            //do something here
            alert("someone poked you: " + dto.message)
        })
    }, [stream]);

    return (
        <>
            <button onClick={() => {
                realtimeApi.join(stream.connectionId!, "chat/123").then(r => {
                    console.log("now we are joined")
                    //setState()
                    alert("Joined " + r.message)
                })
            }}>join a room
            </button>
            <button onClick={() => {
                realtimeApi.send("chat/123", "hello world")
            }}>send message to room
            </button>


            ALL OF THE MESSAGES:
            {
                JSON.stringify(messages)
            }
        </>
    )
}

export default App
