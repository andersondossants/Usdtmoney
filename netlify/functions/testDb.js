const { Client } = require('pg');

exports.handler = async () => {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT NOW() AS agora');
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Conexão OK",
        hora_servidor: res.rows[0].agora
      })
    };
  } catch (err) {
    console.error("Erro de conexão:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};￼Enter
