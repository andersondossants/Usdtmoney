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

    // Buscar o saque pelo id
    const result = await client.query(
      'SELECT email, valentia FROM saques WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      await client.end();
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Saque não encontrado' }),
      };
    }

    const { email, valentia } = result.rows[0];

    // Atualizar status do saque
    await client.query(
      "UPDATE saques SET status = 'aprovado' WHERE id = $1",
      [id]
    );

    // Subtrair o saldo do usuário
    await client.query(
      'UPDATE usuarios SET saldo = saldo - $1 WHERE LOWER(email) = LOWER($2)',
      [valentia, email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Saque aprovado com sucesso!' }),
    };
  } catch (error) {
    console.error('Erro ao aprovar saque:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao aprovar saque' }),
    };
  }
}
