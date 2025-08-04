const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const { referenciador, valorComissao } = JSON.parse(event.body);

    if (!referenciador || !valorComissao) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Dados incompletos" }),
      };
    }

    // Conexão com Neon
    const client = new Client({
      connectionString: process.env.DATABASE_URL, // sua variável de ambiente com a URL do Neon
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();

    // Atualiza a comissão do referenciador
    await client.query(`
      UPDATE usuarios
      SET comissao = COALESCE(comissao, 0) + $1
      WHERE email = $2
    `, [valorComissao, referenciador]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "Comissão adicionada com sucesso" })
    };
  } catch (error) {
    console.error("Erro ao adicionar comissão:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor" })
    };
  }
};
