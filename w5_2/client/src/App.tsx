import './App.css'
import {useStream} from "./useStream.ts";
import {useEffect, useState} from "react";

function App() {
    const stream = useStream();
    const [connected, setConnected] = useState(false);
    const [message, setMessage] = useState([]);
    const [poke, setPoke] = useState<number>(0);

    useEffect(() => {
        stream.on<MessageResponseDto>('chatRoom', 'MessageResponseDto', (dto) => {
            console.log(dto.message);
        })
    }, []);

    return (
        <>
            <button>Join Room</button>
            <button>Send Message</button>
            <button>Poke</button>
            <button>Leave Room</button>
        </>
    )
}

export default App
