const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const { convidado, convidou } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    // Cria tabela se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS indicacoes (
        id SERIAL PRIMARY KEY,
        convidado TEXT,
        convidou TEXT
      );
    `);

    await client.query(
      'INSERT INTO indicacoes (convidado, convidou) VALUES ($1, $2)',
      [convidado, convidou]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ message: "Indicação salva!" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
