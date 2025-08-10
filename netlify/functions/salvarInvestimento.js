import { Client } from '@neondatabase/serverless';

export default async function handler(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };

  const data = JSON.parse(event.body);
  const { email, valor, saldo, lucro, proximo_pagamento } = data;

  if (!email || !valor || saldo === undefined || lucro === undefined || !proximo_pagamento) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Campos obrigatórios faltando' }) };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`
      INSERT INTO investimentos (email, valor, saldo, lucro, proximo_pagamento)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE
      SET valor = EXCLUDED.valor,
          saldo = EXCLUDED.saldo,
          lucro = EXCLUDED.lucro,
          proximo_pagamento = EXCLUDED.proximo_pagamento
    `, [email, valor, saldo, lucro, proximo_pagamento]);

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    await client.end();
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao salvar investimento' }) };
  }
}
