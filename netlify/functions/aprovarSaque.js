const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const { id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Buscar saque usando a coluna "eu ia"
    const saque = await client.query(
      'SELECT "e-mail", valentia FROM saques WHERE "eu ia"=$1',
      [id]
    );

    if (saque.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: 'Saque não encontrado' };
    }

    const { 'e-mail': email, valentia } = saque.rows[0];

    // Atualiza status
    await client.query(
      'UPDATE saques SET status=$1 WHERE "eu ia"=$2',
      ['aprovado', id]
    );

    // Reduz saldo do usuário
    await client.query(
      'UPDATE usuarios SET saldo = saldo - $1 WHERE email=$2',
      [valentia, email]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Erro ao aprovar saque:", err);
    return { statusCode: 500, body: "Erro ao aprovar saque" };
  }
};
