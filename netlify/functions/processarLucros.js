import { Client } from '@neondatabase/serverless';

export default async function handler() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Pega todos que estão com pagamento atrasado
    const result = await client.query(
      'SELECT email, saldo, lucro, proximo_pagamento FROM investimentos WHERE proximo_pagamento <= NOW()'
    );

    for (const row of result.rows) {
      const novoSaldo = parseFloat(row.saldo) + parseFloat(row.lucro);
      const novoPagamento = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await client.query(
        'UPDATE investimentos SET saldo = $1, proximo_pagamento = $2 WHERE email = $3',
        [novoSaldo, novoPagamento, row.email]
      );
      console.log(`Lucro creditado para ${row.email}`);
    }

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true, processados: result.rows.length }) };
  } catch (error) {
    await client.end();
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao processar lucros' }) };
  }
}
