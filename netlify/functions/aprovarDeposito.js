const { Client } = require('pg');

exports.handler = async (event) => {
  const { id } = JSON.parse(event.body || "{}");
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: "ID é obrigatório" }) };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Busca o depósito
    const dep = await client.query("SELECT email, valor, status FROM depositos WHERE id = $1", [id]);
    if (dep.rows.length === 0 || dep.rows[0].status !== 'pendente') {
      await client.end();
      return { statusCode: 404, body: JSON.stringify({ error: "Depósito não encontrado ou já processado" }) };
    }

    const { email, valor } = dep.rows[0];

    // Atualiza o saldo do usuário
    await client.query("UPDATE usuarios SET saldo = saldo + $1 WHERE email = $2", [valor, email]);

    // Marca o depósito como aprovado
    await client.query("UPDATE depositos SET status = 'aprovado' WHERE id = $1", [id]);

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error("Erro aprovarDeposito:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno" }) };
  }
};￼Enter
