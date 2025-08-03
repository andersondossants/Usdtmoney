import { Client } from 'pg';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { valor, rede, comprovativo, email } = JSON.parse(event.body);

    if (!valor || !rede || !comprovativo || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados incompletos' }),
      };
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    await client.query(
      `INSERT INTO depositos (email, valor, rede, status, comprovativo)
       VALUES ($1, $2, $3, 'pendente', $4)`,
      [email, valor, rede, comprovativo]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Depósito registrado com sucesso!' }),
    };
  } catch (error) {
    console.error('Erro ao registrar depósito:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao registrar depósito' }),
    };
  }
}
