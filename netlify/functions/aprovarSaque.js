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

    // Busca o saque
    const saq = await client.query("SELECT email, valor, status FROM saques WHERE id = $1", [id]);
    if (saq.rows.length === 0 || saq.rows[0].status !== 'pendente') {
      await client.end();
      return { statusCode: 404, body: JSON.stringify({ error: "Saque não encontrado ou já processado" }) };
    }

    const { email, valor } = saq.rows[0];

    // Debita do saldo do usuário
    await client.query("UPDATE usuarios SET saldo = saldo - $1 WHERE email = $2 AND saldo >= $1", [valor, email]);

    // Marca o saque como aprovado
    await client.query("UPDATE saques SET status = 'aprovado' WHERE id = $1", [id]);

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error("Erro aprovarSaque:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno" }) };
  }
};￼Enter
