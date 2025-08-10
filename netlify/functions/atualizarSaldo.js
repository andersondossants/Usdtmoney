import { Client } from '@neondatabase/serverless';

export default async function handler(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };

  const data = JSON.parse(event.body);
  const { email, saldo, proximo_pagamento } = data;

  if (!email || saldo === undefined || !proximo_pagamento) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Campos obrigatórios faltando' }) };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(
      'UPDATE investimentos SET saldo = $1, proximo_pagamento = $2 WHERE email = $3',
      [saldo, proximo_pagamento, email]
    );

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    await client.end();
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao atualizar saldo' }) };
  }
}
