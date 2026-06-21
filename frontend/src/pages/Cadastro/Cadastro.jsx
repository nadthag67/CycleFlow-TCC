import { useState } from 'react'; // importa useState para trocar valores do formulário
import { Link } from 'react-router-dom'; // importa Link para trocar de página sem sair do app

function Cadastro() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' }); // guarda nome, email e senhas
  const [error, setError] = useState(''); // guarda mensagem de erro

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value }); // atualiza o campo digitado
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // evita recarregar a página ao enviar
    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha) {
      setError('Preencha todos os campos.'); // erro se algum campo estiver vazio
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem.'); // erro se as senhas forem diferentes
      return;
    }
    setError(''); // limpa erro se tudo estiver certo
  };

  return (
    <main className="container py-5"> {/* área principal da página */}
      <div className="row justify-content-center"> {/* centraliza o formulário */}
        <div className="col-lg-6 col-md-8"> {/* tamanho do formulário em telas grandes e médias */}
          <div className="card shadow-sm p-4"> {/* caixa com sombra */}
            <h2 className="mb-4">Criar Conta</h2> {/* título da página */}
            {error && <div className="alert alert-warning">{error}</div>} {/* mostra o erro se existir */}
            <form onSubmit={handleSubmit}> {/* formulário de cadastro */}
              <div className="mb-3">
                <label className="form-label">Nome</label> {/* rótulo do campo nome */}
                <input
                  type="text" // campo de texto simples
                  className="form-control"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label> {/* rótulo do campo email */}
                <input
                  type="email" // campo de email
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Senha</label> {/* rótulo do campo senha */}
                <input
                  type="password" // campo de senha, texto oculto
                  className="form-control"
                  name="senha"
                  value={form.senha}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Confirmar Senha</label> {/* rótulo para repetir senha */}
                <input
                  type="password"
                  className="form-control"
                  name="confirmarSenha"
                  value={form.confirmarSenha}
                  onChange={handleChange}
                />
              </div>
              <button className="btn btn-primary w-100" type="submit"> {/* botão para enviar o formulário */}
                Criar Conta
              </button>
            </form>
            <p className="mt-4 text-center"> {/* texto com link para login */}
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Cadastro; // exporta o componente Cadastro
