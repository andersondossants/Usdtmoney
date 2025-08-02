// netlify/functions/solicitarDeposito.js
import { Client } from 'pg';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // importante para lidar com FormData
  },
};

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // 1. Processar o FormData (upload)
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erro ao processar form:", err);
      return res.status(500).json({ error: "Erro ao processar os dados" });
    }

    const { email, valor, rede } = fields;
    const comprovativoFile = files.comprovativo;

    // Lê o comprovativo como base64
    let comprovativoBase64 = null;
    if (comprovativoFile) {
      const fileBuffer = fs.readFileSync(comprovativoFile.filepath);
      comprovativoBase64 = fileBuffer.toString('base64');
    }

    // 2. Conectar ao banco Neon (PostgreSQL)
    const client = new Client({
      connectionString: process.env.DATABASE_URL, // configure no Netlify
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();

      // Criar tabela se não existir
      await client.query(`
        CREATE TABLE IF NOT EXISTS depositos (
          id SERIAL PRIMARY KEY,
          email TEXT,
          valor NUMERIC,
          rede TEXT,
          comprovativo TEXT,
          status TEXT DEFAULT 'pendente',
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Inserir depósito
      await client.query(
        `INSERT INTO depositos (email, valor, rede, comprovativo) VALUES ($1, $2, $3, $4)`,
        [email, valor, rede, comprovativoBase64]
      );

      res.status(200).json({ success: true });
    } catch (dbErr) {
      console.error("Erro DB:", dbErr);
      res.status(500).json({ error: "Erro ao gravar no banco" });
    } finally {
      await client.end();
    }
  });
};
