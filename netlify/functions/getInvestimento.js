import { Client } from '@neondatabase/serverless';

export default async function handler(event, context) {
  const email = event.queryStringParameters?.email;
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'Email obrigatório' }) };

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const result = await client.query('SELECT * FROM investimentos WHERE email = $1', [email]);
    await client.end();

    if (result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Investimento não encontrado' }) };
    }

    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
  } catch (error) {
    await client.end();
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro no servidor' }) };
  }
}
