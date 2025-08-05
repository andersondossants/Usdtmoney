const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async (event) => {
  const { email, tipo, valor, data } = JSON.parse(event.body);

  try {
    const result = await pool.query(
      'INSERT INTO transacoes (email, tipo, valor, data) VALUES ($1, $2, $3, $4)',
      [email, tipo, valor, data]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Transação salva com sucesso!' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
