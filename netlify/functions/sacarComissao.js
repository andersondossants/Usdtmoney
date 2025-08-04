const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const { email, valor } = JSON.parse(event.body);

    if (!email || !valor) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: "Dados incompletos." }),
      };
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL, // variável de ambiente do Neon
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 1. Buscar comissão e saldo atual do usuário
    const res = await client.query(
      "SELECT saldo, comissao FROM usuarios WHERE email = $1",
      [email]
    );

    if (res.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ erro: "Usuário não encontrado." }),
      };
    }

    const { saldo, comissao } = res.rows[0];

    if (valor > comissao) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: "Comissão insuficiente." }),
      };
    }

    const novoSaldo = parseFloat(saldo) + parseFloat(valor);
    const novaComissao = parseFloat(comissao) - parseFloat(valor);

    // 2. Atualizar valores no banco
    await client.query(
      "UPDATE usuarios SET saldo = $1, comissao = $2 WHERE email = $3",
      [novoSaldo, novaComissao, email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        novoSaldo,
        novaComissao,
      }),
    };
  } catch (err) {
    console.error("Erro:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: "Erro interno no servidor." }),
    };
  }
};
