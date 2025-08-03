const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const { email, valor, lucroDiario } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 1. Registrar a compra
    await client.query(
      'INSERT INTO compras (email, valor, lucro_diario, data) VALUES ($1,$2,$3,NOW())',
      [email, valor, lucroDiario]
    );

    // 2. Verificar quem indicou este email
    const refResult = await client.query(
      'SELECT convidou FROM indicacoes WHERE convidado = $1 LIMIT 1',
      [email]
    );

    if (refResult.rows.length > 0) {
      const convidou = refResult.rows[0].convidou;
      const bonus = valor * 0.30; // 30% de comissão

      // 3. Adicionar comissão ao usuário que indicou
      await client.query(
        'UPDATE usuarios SET comissao = comissao + $1 WHERE email = $2',
        [bonus, convidou]
      );
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
