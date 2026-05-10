import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './App.css'

// NOTE: StrictMode removed — it intentionally runs effects twice in development
// which causes double-fetching on all polling contexts (notifications, orders)
// and makes it look like there are infinite loop bugs when there aren't.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)