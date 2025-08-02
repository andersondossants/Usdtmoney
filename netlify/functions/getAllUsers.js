const { Client } = require('pg');

exports.handler = async (event) => {
  const adminEmail = "boylouco512@gmail.com";
  const email = event.queryStringParameters?.email;

  if (email !== adminEmail) {
    return { statusCode: 403, body: JSON.stringify({ error: "Acesso negado" }) };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query("SELECT id, email, saldo FROM usuarios ORDER BY id ASC");
    await client.end();
    return { statusCode: 200, body: JSON.stringify(result.rows) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
