import { BrowserRouter } from 'react-router-dom'; // importa o roteador do React
import AppRoutes from './routes/AppRoutes.jsx'; // importa as rotas do app

function App() {
  return (
    <BrowserRouter> {/* ativa a navegação por links e endereços */}
      <AppRoutes /> {/* carrega o componente que mostra cada página */}
    </BrowserRouter>
  );
}

export default App; // exporta o componente App para uso no React
