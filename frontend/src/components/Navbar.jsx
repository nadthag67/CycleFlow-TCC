import { NavLink } from 'react-router-dom'; // importa links que mudam de página sem recarregar

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-soft py-3"> {/* cria a barra de navegação */}
      <div className="container"> {/* coloca o conteúdo alinhado no centro */}
        <NavLink className="navbar-brand fw-bold" to="/"> {/* link para a página inicial */}
          CycleFlow
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" /> {/* ícone do botão para abrir o menu em celular */}
        </button>
        <div className="collapse navbar-collapse" id="navbarNav"> {/* menu que aparece/oculta em dispositivos menores */}
          <ul className="navbar-nav ms-auto"> {/* lista de links do menu */}
            <li className="nav-item"> {/* item 1 do menu */}
              <NavLink className="nav-link" to="/dashboard"> {/* link para o dashboard */}
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item"> {/* item 2 do menu */}
              <NavLink className="nav-link" to="/calendario"> {/* link para o calendário */}
                Calendário
              </NavLink>
            </li>
            <li className="nav-item"> {/* item 3 do menu */}
              <NavLink className="nav-link" to="/sintomas"> {/* link para sintomas */}
                Sintomas
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; // exporta o menu para usar em outras páginas
