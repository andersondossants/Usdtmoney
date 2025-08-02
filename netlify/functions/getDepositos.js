import { Client } from 'pg';

export const handler = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT id, email, valor, rede, status, criado_em
      FROM depositos
      ORDER BY criado_em DESC
    `);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // caso precise acessar de outro domínio
      },
    };
  } catch (err) {
    console.error('Erro ao buscar depósitos:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao buscar depósitos' }),
    };
  }
};
