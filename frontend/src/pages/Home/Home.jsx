import { Link } from 'react-router-dom'; // importa Link para ir a outras páginas

function Home() {
  return (
    <main className="container py-5"> {/* área principal da home */}
      <div className="row align-items-center gy-4"> {/* divide em duas colunas */}
        <div className="col-lg-6"> {/* primeira coluna com texto */}
          <span className="badge bg-secondary text-dark mb-3">CycleFlow</span> {/* etiqueta do app */}
          <h1 className="display-5 fw-bold">Acompanhe seu ciclo com cuidado e confiança</h1> {/* título grande */}
          <p className="lead text-muted"> {/* parágrafo explicando o app */}
            Uma plataforma elegante para monitorar seu ciclo menstrual, sintomas e previsões.
            Planeje seu bem-estar com informações visuais e intuitivas.
          </p>
          <div className="d-flex gap-3 flex-wrap"> {/* botões lado a lado */}
            <Link className="btn btn-primary btn-lg" to="/login"> {/* botão para login */}
              Entrar
            </Link>
            <Link className="btn btn-outline-dark btn-lg" to="/cadastro"> {/* botão para cadastro */}
              Criar Conta
            </Link>
          </div>
        </div>
        <div className="col-lg-6 text-center"> {/* segunda coluna com imagem */}
          <div className="p-4 rounded-4 bg-soft"> {/* caixa da imagem */}
            <img
              src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80" // imagem ilustrativa
              alt="Mulher usando app" // texto para descrever a imagem
              className="img-fluid rounded-4 shadow" // estilo da imagem
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home; // exporta o componente Home
