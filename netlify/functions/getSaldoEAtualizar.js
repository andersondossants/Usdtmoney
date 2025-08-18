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

    const diffMs = agora - ultimo;
    const ciclos = Math.floor(diffMs / CYCLE_MS);

    // 🔍 LOGS PARA DEPURAÇÃO
    console.log("=====================================");
    console.log("Email:", email);
    console.log("Saldo atual:", saldo);
    console.log("Lucro por ciclo:", lucro_diario);
    console.log("Último pagamento salvo:", ultimo_pagamento);
    console.log("Agora (ms):", agora);
    console.log("Último (ms):", ultimo);
    console.log("Diferença em ms:", diffMs);
    console.log("Ciclos passados:", ciclos);
    console.log("=====================================");

    if (ciclos > 0 && lucro_diario > 0) {
      lucro_creditado = ciclos * lucro_diario;
      saldo += lucro_creditado;

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
    console.error("❌ Erro no getSaldoEAtualizar:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: "Erro no servidor" })
    };
  }
};
