import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { initAnalytics } from './lib/analytics'

// Dimuat sebelum render supaya kunjungan awal ikut terukur; tanpa variabel
// lingkungan yang diisi, fungsi ini tidak melakukan apa pun.
initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
