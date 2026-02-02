import {useEffect, useState} from 'react'
import './App.css'
import {type MessageResponse, type PokeResponse, type JoinResponse, RealtimeClient} from "./generated-ts-client.ts";
import {useStream} from "./useStream.tsx";

const realtimeApi = new RealtimeClient("http://localhost:5000")

function App() {

    const stream = useStream();
    const [messages, setMessages] = useState<MessageResponse[]>([])

    useEffect(() => {
        stream.on<MessageResponse>("123", "MessageResponse", (dto) => {
            alert(dto.from + "sent a message:" + dto.message)
            setMessages((prev) => [...prev, dto])
        })
        stream.on<PokeResponse>("123", "PokeResponse", (dto) => {
            //do something here
            alert(dto.from + " has poked you: " + dto.message)
        })
        stream.on<JoinResponse>("123", "JoinResponse", (dto) => {
            alert(dto.who + ": " + dto.message)
        })
    }, [stream]);

    return (
        <>
            <button disabled={!stream.isConnected} onClick={() => {
                realtimeApi.join(stream.connectionId!, "123").then(r => {
                    console.log("now we are joined")
                    //setState()
                    alert("Joined " + r.message)
                })
            }}>join a room
            </button>
            <button onClick={() => {
                realtimeApi.send("123", "hello world")
            }}>send message to room
            </button>
            <button onClick={() =>
            realtimeApi.poke("c5ec1ca3-abc7-475b-b738-3a507f38373a")}>Poke</button>


            ALL OF THE MESSAGES:
            {
                JSON.stringify(messages)
            }
        </>
    )
}

export default App
