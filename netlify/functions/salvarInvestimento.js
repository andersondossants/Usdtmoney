import { Client } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { email, valor, saldo, lucro, proximo_pagamento } = req.body;
  if (!email || !valor || !saldo || !lucro || !proximo_pagamento) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(
      `INSERT INTO investimentos (email, valor, saldo, lucro, proximo_pagamento)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) 
       DO UPDATE SET valor=$2, saldo=$3, lucro=$4, proximo_pagamento=$5`,
      [email, valor, saldo, lucro, proximo_pagamento]
    );

    await client.end();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar investimento' });
  }
}
