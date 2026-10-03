import dotenv from 'dotenv';
dotenv.config();

import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import cors from 'cors';
import { sql, poolPromise } from './db.js';

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.use(cors());
app.use(express.json());

// 1. ROTA: Cadastrar Usuária
app.post('/api/usuarios', async (req, res) => {
  const { nome, email, password } = req.body;
  try {
  const pool = await poolPromise;
    await pool.request()
      .input('nome', sql.VarChar, nome)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .query('INSERT INTO Usuaria (nome, email, password) VALUES (@nome, @email, @password)');
      
    res.status(201).json({ message: 'Usuária cadastrada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 2. ROTA: Login de Usuária (Aceita /api/login e /api/usuarios/login)
app.post(['/api/usuarios/login', '/api/login'], async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .query('SELECT id_usuaria, nome, email FROM Usuaria WHERE email = @email AND password = @password');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    res.status(200).json({
      message: 'Login efetuado com sucesso!',
      usuario: result.recordset[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROTA: Login com Google
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;

  try {
    // 1. O backend confirma com a Google se o token é válido
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // 2. Extrai os dados da conta Google (nome e email)
    const payload = ticket.getPayload();
    const { name, email } = payload;

    const pool = await poolPromise;

    // 3. Verifica se a usuária já está registada no SQL Server
    const userCheck = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Usuaria WHERE email = @email');

    if (userCheck.recordset.length > 0) {
      // Se a usuária já existe, entra direto (Login)
      res.status(200).json({ 
        message: 'Login com Google bem sucedido!', 
        user: userCheck.recordset[0] 
      });
    } else {
      // 4. Se não existe, regista a usuária automaticamente.
      await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, 'conta_google_oauth')
        .query('INSERT INTO Usuaria (nome, email, password) VALUES (@name, @email, @password)');

      // Vai buscar os dados da usuária que acabou de ser criada
      const newUser = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM Usuaria WHERE email = @email');

      res.status(201).json({ 
        message: 'Conta criada via Google com sucesso!', 
        user: newUser.recordset[0] 
      });
    }
  } catch (error) {
    console.error('Erro na autenticação com Google:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. ROTA: Registrar Humor e Sintomas (Pop-up "Como você está hoje?")
app.post('/api/diario', async (req, res) => {
  const { id_usuaria, data_registo, humor, sintomas, anotacoes } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id_usuaria', sql.Int, id_usuaria)
      .input('data_registo', sql.Date, data_registo)
      .input('humor', sql.VarChar, humor)
      .input('sintomas', sql.VarChar, sintomas)
      .input('anotacoes', sql.VarChar, anotacoes)
      .query(`
        MERGE RegistoDiario AS target
        USING (SELECT @id_usuaria AS id_usuaria, @data_registo AS data_registo) AS source
        ON (target.id_usuaria = source.id_usuaria AND target.data_registo = source.data_registo)
        WHEN MATCHED THEN
          UPDATE SET humor = @humor, sintomas = @sintomas, anotacoes = @anotacoes
        WHEN NOT MATCHED THEN
          INSERT (id_usuaria, data_registo, humor, sintomas, anotacoes)
          VALUES (@id_usuaria, @data_registo, @humor, @sintomas, @anotacoes);
      `);

    res.status(200).json({ message: 'Registro salvo com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ROTA: Gerar Código de Compartilhamento (ex: CF-A1B2)
app.post('/api/compartilhar/gerar', async (req, res) => {
  const { id_usuaria } = req.body;
  const codigo = 'CF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id_usuaria', sql.Int, id_usuaria)
      .input('codigo', sql.VarChar, codigo)
      .query('UPDATE Usuaria SET codigo_partilha = @codigo WHERE id_usuaria = @id_usuaria');

    res.status(200).json({ codigo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ROTA: Entrar no Acompanhamento por Código
app.post('/api/compartilhar/entrar', async (req, res) => {
  const { id_usuaria, codigo_partilha } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('codigo', sql.VarChar, codigo_partilha)
      .query('SELECT id_usuaria FROM Usuaria WHERE codigo_partilha = @codigo');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Código inválido ou não encontrado.' });
    }

    const id_seguida = result.recordset[0].id_usuaria;
    await pool.request()
      .input('id_usuaria', sql.Int, id_usuaria)
      .input('id_seguida', sql.Int, id_seguida)
      .query('UPDATE Usuaria SET id_usuaria_seguida = @id_seguida WHERE id_usuaria = @id_usuaria');

    res.status(200).json({ message: 'Acompanhamento ativado!', id_seguida });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Cycle Flow rodando na porta ${PORT}`);
});
// 6. Rota para buscar os dados compartilhados do ciclo
app.post('/api/compartilhar/dados', async (req, res) => {
  const { codigo_partilha, viewerEmail } = req.body;
  try {
    const pool = await getConnection();
    
    // 1. Procurar a usuaria dona do código de partilha
    const resultUser = await pool.request()
      .input('codigo', sql.VarChar, codigo_partilha)
      .query('SELECT id_usuaria, email FROM Usuaria WHERE codigo_partilha = @codigo');

    if (resultUser.recordset.length === 0) {
      return res.status(404).json({ error: 'Código inválido ou expirado.' });
    }

    const ownerId = resultUser.recordset[0].id_usuaria;
    const ownerEmail = resultUser.recordset[0].email;

    // 2. Buscar os dados do ciclo (ajusta o nome da tabela 'Ciclos' se na tua BD tiver outro nome)
    const resultCiclo = await pool.request()
      .input('id_usuaria', sql.Int, ownerId)
      .query('SELECT TOP 1 dataInicio, duracaoCiclo, duracaoPeriodo FROM Ciclos WHERE id_usuaria = @id_usuaria ORDER BY id_ciclo DESC');

    const cycle = resultCiclo.recordset.length > 0 ? resultCiclo.recordset[0] : {
      dataInicio: "2026-09-01",
      duracaoCiclo: 28,
      duracaoPeriodo: 5
    };

    res.json({
      permissions: {
        can_view_cycle: true,
        can_view_calendar: true,
        can_view_notes: true,
        can_view_checkins: true
      },
      syncedAt: new Date().toISOString(),
      cycle: cycle,
      records: []
    });

  } catch (err) {
  console.error("Erro ao buscar dados compartilhados:", err);
  res.status(500).json({ error: err.message });
}
});