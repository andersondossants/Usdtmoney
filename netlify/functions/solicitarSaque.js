import { Client } from 'pg';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  const { email, valor, endereco, rede } = JSON.parse(event.body);

  if (!email || !valor || !endereco || !rede) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Dados incompletos' }) };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      `INSERT INTO saques (email, valor, rede, endereco, status)
       VALUES ($1, $2, $3, $4, 'pendente')`,
      [email, valor, rede, endereco]
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
