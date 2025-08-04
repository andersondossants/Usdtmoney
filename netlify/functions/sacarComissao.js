const { sql } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  try {
    const { email, valor, carteira, rede } = JSON.parse(event.body);

    if (!email || !valor || !carteira || !rede) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados incompletos' })
      };
    }

    // Busca comissão atual
    const { rows } = await sql`SELECT comissao FROM usuarios WHERE email = ${email}`;
    if (rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    const comissaoAtual = parseFloat(rows[0].comissao);
    if (valor > comissaoAtual) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Comissão insuficiente' })
      };
    }

    // Atualiza: Subtrai comissão, adiciona no saldo
    await sql`
      UPDATE usuarios 
      SET comissao = comissao - ${valor},
          saldo = saldo + ${valor}
      WHERE email = ${email}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao processar saque da comissão' })
    };
  }
};
