import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
ReactDOM.createRoot(document.getElementById('root')!).render(
 
 <GoogleOAuthProvider clientId="359439238122-23bheppeb6tio02mttkrl1lt3li8l91p.apps.googleusercontent.com">
  <App />
</GoogleOAuthProvider>

)

