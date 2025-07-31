const { Client } = require("pg");

exports.handler = async () => {
  try {
    const client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URI,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Conexão ao Neon OK!" }),
    };
  } catch (error) {
    console.error("Erro ao conectar:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
