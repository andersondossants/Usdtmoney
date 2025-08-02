import { Client } from 'pg';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  const { email, valor, rede } = JSON.parse(event.body);

  if (!email || !valor || !rede) {
    return { statusCode: 400, body: 'Dados incompletos' };
  }

  // Conecta no banco Neon
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // configure no Netlify
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Cria tabela se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS depositos (
        id SERIAL PRIMARY KEY,
        email TEXT,
        valor NUMERIC,
        rede TEXT,
        status TEXT DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Salva a solicitação de depósito
    await client.query(
      `INSERT INTO depositos (email, valor, rede, status)
       VALUES ($1, $2, $3, 'pendente')`,
      [email, valor, rede]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Erro ao salvar depósito:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
