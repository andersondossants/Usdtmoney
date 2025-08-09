const { Client } = require("pg");

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  console.log('raw body:', event.body);
  const payload = JSON.parse(event.body || "{}");
  let { email, valor, lucro_diario } = payload;

  // Normalizar strings com vírgula para ponto
  if (typeof valor === 'string') valor = valor.replace(',', '.').trim();
  if (typeof lucro_diario === 'string') lucro_diario = lucro_diario.replace(',', '.').trim();

  const valorNum = Number(valor);
  const lucroNum = Number(lucro_diario);

  // Validações claras
  if (!email || !isFinite(valorNum) || !isFinite(lucroNum)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        sucesso: false,
        mensagem: "Dados inválidos. Envie email, valor e lucro_diario numéricos (use ponto como separador decimal).",
        received: { email, valor, lucro_diario }
      })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Inserir usando NOW() + interval '5 minutes' (evita inconsistências de timezone)
    const insert = await client.query(
      `INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
       VALUES ($1, $2, $3, NOW() + interval '5 minutes')
       RETURNING id, email, valor, lucro_diario, proximo_pagamento`,
      [email, valorNum, lucroNum]
    );

    // Registrar transação
    await client.query(
      `INSERT INTO transacoes (email, tipo, valor, data)
       VALUES ($1, 'Investimento', $2, NOW())`,
      [email, valorNum]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true, investimento: insert.rows[0] })
    };

  } catch (err) {
    console.error("Erro ao salvar investimento:", err);
    try { await client.end(); } catch(_) {}
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: "Erro no servidor", detalhe: err.message })
    };
  }
};
