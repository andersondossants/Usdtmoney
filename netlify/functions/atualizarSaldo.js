import { Client } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { email, saldo, proximo_pagamento } = req.body;
  if (!email || saldo === undefined || !proximo_pagamento) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(
      "UPDATE investimentos SET saldo=$1, proximo_pagamento=$2 WHERE email=$3",
      [saldo, proximo_pagamento, email]
    );

    await client.end();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar saldo' });
  }
}
