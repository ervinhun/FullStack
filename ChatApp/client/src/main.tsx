import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {StreamProvider} from "./useStream.tsx";

createRoot(document.getElementById('root')!).render(
    <StreamProvider config={{
        connectEvent: 'connected',
        urlForStreamEndpoint: 'http://localhost:5000/connect'
    }}>
        <App/>
    </StreamProvider>,
)
