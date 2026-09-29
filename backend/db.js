import sql from 'mssql';

const config = {
    user: 'nad_SQLLogin_3',
    password: 'uk8o2ymsf7', // Substitui pela tua palavra-passe do Somee
    server: 'Cycle-flow.mssql.somee.com',
    database: 'Cycle-flow',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Conectado ao SQL Server na nuvem (Somee)!');
        return pool;
    })
    .catch(err => console.log('Erro na conexão com a base de dados:', err));

export { sql, poolPromise };