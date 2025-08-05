const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async (event) => {
  const email = event.queryStringParameters.email;

  try {
    const result = await pool.query(
      'SELECT * FROM transacoes WHERE email = $1 ORDER BY data DESC',
      [email]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
