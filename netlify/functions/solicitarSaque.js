import { Client } from 'pg';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  const { email, valor, carteira, rede } = JSON.parse(event.body);

  if (!email || !valor || !carteira || !rede) {
    return { statusCode: 400, body: 'Dados incompletos' };
  }

  // Conecta no banco Neon
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // configure no Netlify
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      `INSERT INTO saques (email, valor, carteira, rede, status)
       VALUES ($1, $2, $3, $4, 'pendente')`,
      [email, valor, carteira, rede]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Erro ao salvar saque:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
