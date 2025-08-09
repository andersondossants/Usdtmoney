import { Client } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const result = await client.query(
      "SELECT * FROM investimentos WHERE email = $1 LIMIT 1",
      [email]
    );

    await client.end();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar investimento' });
  }
}
