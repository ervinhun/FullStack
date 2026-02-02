import {useEffect, useState} from 'react'
import './App.css'
import {type MessageResponse, type PokeResponse, type JoinResponse, type DmMessageResponse, RealtimeClient} from "./generated-ts-client.ts";
import {useStream} from "./useStream.tsx";

const realtimeApi = new RealtimeClient("http://localhost:5000")

function App() {

    const stream = useStream()
    const [messages, setMessages] = useState<MessageResponse[]>([])
    //const [dmMessages, setDmMessages] = useState<DmMessageResponse[]>([])
    const [clientIdForPoke, setClientIdForPoke] = useState<string>("")
    const [shaking, setShaking] = useState(false);

    useEffect(() => {
        stream.on<MessageResponse>("123", "MessageResponse", (dto) => {
            alert(dto.from + "sent a message:" + dto.message)
            setMessages((prev) => [...prev, dto])
        })
        stream.on<PokeResponse>("message", "PokeResponse", (dto) => {
            //do something here
            setShaking(true)
            alert(dto.from + " has poked you: " + dto.message)
            setTimeout(() =>
                    setShaking(false), 500);
        })
        stream.on<JoinResponse>("123", "JoinResponse", (dto) => {
            if (dto.who !== stream.connectionId)
                alert(dto.who + ": " + dto.message)
        })
        stream.on<DmMessageResponse>("message", "DmMessageResponse", (dto) => {
            alert(dto.from + " Sent you a messsage: " + dto.message)
        })
    }, [stream]);

    return (
        <>
            <div className={shaking ? "shake" : ""}>
                <input id="clientId" onChange={(e) => {
                    setClientIdForPoke(e.target.value)
                    console.log(clientIdForPoke)
                }} placeholder="Client ID"/>
                <button disabled={!stream.isConnected} onClick={() => {
                    realtimeApi.join(stream.connectionId!, "123").then(r => {
                        //setState()
                        alert("Joined " + r.message)
                    })
                }}>join a room
                </button>
                <button onClick={() => {
                    realtimeApi.send("123", "hellao world")
                }}>send message to room
                </button>
                <button onClick={() => {
                    realtimeApi.poke(clientIdForPoke)
                }}>Poke
                </button>
                <button onClick={() => {
                    realtimeApi.sendDm(stream.connectionId?.toString(), clientIdForPoke, "Sziaaaaaaaa")
                }}>Private
                </button>


                ALL OF THE MESSAGES:
                {
                    JSON.stringify(messages)
                }
            </div>
        </>
    )
}

export default App
