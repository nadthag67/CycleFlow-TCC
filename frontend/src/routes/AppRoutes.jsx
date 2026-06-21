import { Routes, Route } from 'react-router-dom'; // importa componentes de rota
import Navbar from '../components/Navbar.jsx'; // importa o menu do topo
import Home from '../pages/Home/Home.jsx'; // importa a página inicial
import Login from '../pages/Login/Login.jsx'; // importa a página de login
import Cadastro from '../pages/Cadastro/Cadastro.jsx'; // importa a página de cadastro
import Dashboard from '../pages/Dashboard/Dashboard.jsx'; // importa o painel
import Calendario from '../pages/Calendario/Calendario.jsx'; // importa a página de calendário
import Sintomas from '../pages/Sintomas/Sintomas.jsx'; // importa a página de sintomas
import Perfil from '../pages/Perfil/Perfil.jsx'; // importa a página de perfil
import Compartilhar from '../pages/Compartilhar/Compartilhar.jsx'; // importa a página de compartilhar
import Premium from '../pages/Premium/Premium.jsx'; // importa a página premium
import Configuracoes from '../pages/Configuracoes/Configuracoes.jsx'; // importa a página de configurações

function AppRoutes() {
  return (
    <>
      <Navbar /> {/* mostra o menu no topo da página */}
      <Routes> {/* define quais páginas aparecem em cada endereço */}
        <Route path="/" element={<Home />} /> {/* rota da página inicial */}
        <Route path="/login" element={<Login />} /> {/* rota do login */}
        <Route path="/cadastro" element={<Cadastro />} /> {/* rota do cadastro */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* rota do painel */}
        <Route path="/calendario" element={<Calendario />} /> {/* rota do calendário */}
        <Route path="/sintomas" element={<Sintomas />} /> {/* rota dos sintomas */}
        <Route path="/perfil" element={<Perfil />} /> {/* rota do perfil */}
        <Route path="/compartilhar" element={<Compartilhar />} /> {/* rota para compartilhar */}
        <Route path="/premium" element={<Premium />} /> {/* rota premium */}
        <Route path="/configuracoes" element={<Configuracoes />} /> {/* rota de configurações */}
      </Routes>
    </>
  );
}

export default AppRoutes; // exporta o componente de rotas
