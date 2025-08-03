import { Client } from 'pg';

export async function handler(event) {
  try {
    const { id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 1. Buscar dados do saque
    const result = await client.query(
      'SELECT email, valor FROM saques WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      await client.end();
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Saque não encontrado' }),
      };
    }

    const { email, valor } = result.rows[0];

    // 2. Atualizar o status para aprovado
    await client.query(
      "UPDATE saques SET status = 'aprovado' WHERE id = $1",
      [id]
    );

    // Aqui você poderia atualizar o saldo do usuário se fosse necessário
    // await client.query("UPDATE usuarios SET saldo = saldo - $1 WHERE email = $2", [valor, email]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Saque aprovado com sucesso' }),
    };
  } catch (error) {
    console.error('Erro ao aprovar saque:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao aprovar saque' }),
    };
  }
  }
