import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Ex3 from './Ex3.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Ex3 />
  </StrictMode>,
)
