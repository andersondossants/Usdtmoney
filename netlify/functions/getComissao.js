const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Defina isso no painel Netlify (Environment Variables)
  ssl: {
    rejectUnauthorized: false
  }
});

exports.handler = async (event) => {
  const email = event.queryStringParameters.email;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email não fornecido' })
    };
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT comissao FROM usuarios WHERE email = $1', [email]);
    client.release();

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ comissao: result.rows[0].comissao || 0 })
    };
  } catch (error) {
    console.error('Erro ao buscar comissão:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao buscar comissão' })
    };
  }
};
