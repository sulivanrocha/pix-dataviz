// src/main.jsx
// Ponto de entrada. BrowserRouter precisa envolver App para que useLocation
// e <Routes> funcionem. <Analytics /> fica dentro do router para registrar
// mudanças de rota, não apenas o carregamento inicial.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import { initAnalytics } from './lib/analytics.js'

initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Analytics />
    </BrowserRouter>
  </StrictMode>,
)