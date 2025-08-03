import { Client } from 'pg';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Buscar o depósito pelo id
    const result = await client.query(
      'SELECT email, valentia FROM depositos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      await client.end();
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Depósito não encontrado' }),
      };
    }

    const { email, valentia } = result.rows[0];

    // Atualizar status do depósito
    await client.query(
      "UPDATE depositos SET status = 'aprovado' WHERE id = $1",
      [id]
    );

    // Somar saldo do usuário
    await client.query(
      'UPDATE usuarios SET saldo = saldo + $1 WHERE LOWER(email) = LOWER($2)',
      [valentia, email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Depósito aprovado com sucesso!' }),
    };
  } catch (error) {
    console.error('Erro ao aprovar depósito:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao aprovar depósito' }),
    };
  }
}
