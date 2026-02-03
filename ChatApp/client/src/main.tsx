import {createRoot} from 'react-dom/client'
import './index.css'
import ChatRoom from './pages/chatRoom/ChatRoom.tsx'
import {StreamProvider} from "./helpers/useStream.tsx"

createRoot(document.getElementById('root')!).render(
    <StreamProvider config={{
        connectEvent: 'connected',
        urlForStreamEndpoint: 'http://localhost:5000/connect'
    }}>
        <ChatRoom/>
    </StreamProvider>,
)
