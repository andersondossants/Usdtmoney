const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Método não permitido" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error("JSON inválido:", err);
    return { statusCode: 400, body: "JSON inválido" };
  }

  const { id } = body;

  if (!id) {
    return { statusCode: 400, body: "ID do depósito é obrigatório" };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Busca o depósito pelo ID
    const depositoRes = await client.query(
      'SELECT email, valor FROM depositos WHERE id=$1',
      [id]
    );

    if (depositoRes.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: 'Depósito não encontrado' };
    }

    const { email, valor } = depositoRes.rows[0];

    // 2. Atualiza status do depósito para aprovado
    await client.query(
      'UPDATE depositos SET status=$1 WHERE id=$2',
      ['aprovado', id]
    );

    // 3. Atualiza saldo do usuário (soma o valor)
    await client.query(
      'UPDATE usuarios SET saldo = saldo + $1 WHERE email=$2',
      [valor, email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("Erro ao aprovar depósito:", err);
    return { statusCode: 500, body: "Erro ao aprovar depósito" };
  }
};
