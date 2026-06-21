import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode> {/* modo estrito ajuda a encontrar erros no app */}
    <App /> {/* monta o componente principal dentro da página */}
  </React.StrictMode>
);
