import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { loadEmailTemplatesFromServer } from './data/emailTemplates'

// Load email templates from server (non-blocking)
loadEmailTemplatesFromServer().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
