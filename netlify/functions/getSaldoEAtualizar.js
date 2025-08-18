const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CYCLE_MS = 2 * 60 * 1000; // 2 minutos

exports.handler = async (event) => {
  const email = event.queryStringParameters.email;
  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "Email não informado" })
    };
  }

  try {
    const client = await pool.connect();

    // Busca investimento do usuário
    const res = await client.query(
      "SELECT saldo, lucro_diario, ultimo_pagamento FROM usuarios WHERE email = $1",
      [email]
    );

    if (res.rows.length === 0) {
      client.release();
      return {
        statusCode: 200,
        body: JSON.stringify({ sucesso: true, saldo: 0, lucro_creditado: 0 })
      };
    }

    let { saldo, lucro_diario, ultimo_pagamento } = res.rows[0];
    let lucro_creditado = 0;

    const agora = Date.now();
    const ultimo = ultimo_pagamento ? new Date(ultimo_pagamento).getTime() : agora;

    // Calcula quantos ciclos de 2 min já passaram
    const ciclos = Math.floor((agora - ultimo) / CYCLE_MS);

    if (ciclos > 0) {
      lucro_creditado = ciclos * lucro_diario;
      saldo += lucro_creditado;

      // Atualiza no banco
      await client.query(
        "UPDATE usuarios SET saldo = $1, ultimo_pagamento = NOW() WHERE email = $2",
        [saldo, email]
      );
    }

    client.release();

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true, saldo, lucro_creditado })
    };
  } catch (err) {
    console.error("Erro no getSaldoEAtualizar:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: "Erro no servidor" })
    };
  }
};
