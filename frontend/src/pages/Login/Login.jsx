import { useState } from 'react'; // importa useState para guardar valores que mudam
import { Link } from 'react-router-dom'; // importa Link para trocar de página sem recarregar

function Login() {
  const [form, setForm] = useState({ email: '', senha: '' }); // guarda email e senha do usuário
  const [error, setError] = useState(''); // guarda mensagem de erro para mostrar ao usuário

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value }); // atualiza o campo digitado no formulário
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // evita que a página recarregue quando enviar o formulário
    if (!form.email || !form.senha) {
      setError('Preencha todos os campos.'); // mostra erro se email ou senha estiverem vazios
      return;
    }
    setError(''); // limpa o erro se tudo estiver certo
  };

  return (
    <main className="container py-5"> {/* área principal da página */}
      <div className="row justify-content-center"> {/* centraliza o conteúdo */}
        <div className="col-lg-6 col-md-8"> {/* largura do cartão em diferentes telas */}
          <div className="card shadow-sm p-4"> {/* caixa branca com sombra */}
            <h2 className="mb-4">Entrar</h2> {/* título da página */}
            {error && <div className="alert alert-warning">{error}</div>} {/* mostra erro se existir */}
            <form onSubmit={handleSubmit}> {/* formulário de login */}
              <div className="mb-3">
                <label className="form-label">Email</label> {/* texto do campo email */}
                <input
                  type="email" // tipo email para teclado correto
                  className="form-control" // estilo do Bootstrap
                  name="email" // nome do campo usado no handleChange
                  value={form.email} // valor atual do campo
                  onChange={handleChange} // chama ao digitar
                  placeholder="nome@exemplo.com" // dica dentro do campo
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Senha</label> {/* texto do campo senha */}
                <input
                  type="password" // esconde o texto digitado
                  className="form-control"
                  name="senha"
                  value={form.senha}
                  onChange={handleChange}
                />
              </div>
              <button className="btn btn-primary w-100" type="submit"> {/* botão envia o formulário */}
                Entrar
              </button>
            </form>
            <p className="mt-4 text-center"> {/* texto abaixo do formulário */}
              Não tem conta? <Link to="/cadastro">Criar conta</Link> {/* link para página de cadastro */}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login; // exporta o componente para usar em outras partes do app
