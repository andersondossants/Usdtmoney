import { Client } from 'pg';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  const formData = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString()
    : event.body;

  // No front enviamos multipart/form-data, mas para simplificar:
  // se quiser apenas JSON, altere o fetch para enviar JSON.

  // Aqui usaremos JSON. Ajuste o front se necessário.
  const { email, valor, rede } = JSON.parse(formData);

  if (!email || !valor || !rede) {
    return { statusCode: 400, body: 'Dados incompletos' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    await client.query(
      `INSERT INTO depositos (email, valor, rede, status)
       VALUES ($1, $2, $3, 'pendente')`,
      [email, valor, rede]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Erro ao salvar depósito:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
