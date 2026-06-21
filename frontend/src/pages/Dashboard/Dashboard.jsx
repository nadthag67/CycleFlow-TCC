function Dashboard() {
  const cards = [
    { title: 'Próxima menstruação', value: '16/jul/2026' }, // cartão com data da próxima menstruação
    { title: 'Próxima ovulação', value: '30/jul/2026' }, // cartão com data da próxima ovulação
    { title: 'Dias restantes', value: '8 dias' }, // cartão com dias restantes
    { title: 'Últimos sintomas', value: 'Cólica leve, cansaço' }, // cartão com sintomas recentes
  ];

  return (
    <main className="container py-5"> {/* área principal do dashboard */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-4 mb-4"> {/* título e descrição */}
        <div>
          <h2 className="mb-2">Dashboard</h2> {/* título da página */}
          <p className="text-muted">Resumo do ciclo e sintomas recentes.</p> {/* descrição */}
        </div>
      </div>
      <div className="row gy-4"> {/* linha de cartões */}
        {cards.map((card) => (
          <div className="col-md-6 col-xl-3" key={card.title}> {/* cada cartão ocupa parte da linha */}
            <div className="card shadow-sm p-4 h-100"> {/* cartão com sombra */}
              <h5 className="card-title">{card.title}</h5> {/* título do cartão */}
              <p className="card-text fs-4 fw-semibold">{card.value}</p> {/* valor do cartão */}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Dashboard; // exporta o componente Dashboard
