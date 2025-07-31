const { Client } = require('pg');

exports.handler = async () => {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(
      "SELECT id, email, valor, status FROM saques ORDER BY id DESC"
    );
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error("Erro getSaques:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno" }) };
  }
};￼Enter
