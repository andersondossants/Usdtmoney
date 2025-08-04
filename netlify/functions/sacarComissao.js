const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event) => {
  const { email, valor, carteira, rede } = JSON.parse(event.body || '{}');

  if (!email || !valor || !carteira || !rede) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Dados incompletos" })
    };
  }

  try {
    const result = await sql`
      SELECT comissao FROM usuarios WHERE email = ${email};
    `;

    const comissaoAtual = parseFloat(result[0]?.comissao || 0);

    if (comissaoAtual < valor) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Comissão insuficiente" })
      };
    }

    // Subtrai comissão
    await sql`
      UPDATE usuarios SET comissao = comissao - ${valor} WHERE email = ${email};
    `;

    // Registra o saque
    await sql`
      INSERT INTO saques_comissao (email, valor, carteira, rede, status)
      VALUES (${email}, ${valor}, ${carteira}, ${rede}, 'pendente');
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true })
    };

  } catch (error) {
    console.error("Erro ao sacar comissão:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao processar o saque" })
    };
  }
};
