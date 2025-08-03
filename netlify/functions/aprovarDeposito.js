import { Client } from 'pg';

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const { id } = JSON.parse(event.body);
    await client.connect();

    // 1. Buscar email e valor do depósito
    const result = await client.query(
      'SELECT email, valor FROM depositos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Depósito não encontrado' }),
      };
    }

    const { email, valor } = result.rows[0];

    // 2. Aprovar o depósito
    await client.query(
      "UPDATE depositos SET status = 'aprovado' WHERE id = $1",
      [id]
    );

    // 3. Somar o valor ao saldo do usuário
    await client.query(
      `UPDATE usuarios 
       SET saldo = saldo + $1 
       WHERE TRIM(LOWER(email)) = TRIM(LOWER($2))`,
      [valor, email]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Depósito aprovado e saldo atualizado' }),
    };
  } catch (error) {
    console.error('Erro ao aprovar depósito:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao aprovar depósito' }),
    };
  } finally {
    await client.end();
  }
      }
