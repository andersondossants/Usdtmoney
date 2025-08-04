const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async (event) => {
  try {
    const { email, valor, carteira, rede } = JSON.parse(event.body);

    // Verifica se o usuário existe e tem comissão suficiente
    const { rows } = await pool.query('SELECT comissao, saldo FROM usuarios WHERE email = $1', [email]);
    if (rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
    }

    const comissaoAtual = parseFloat(rows[0].comissao);
    const saldoAtual = parseFloat(rows[0].saldo);

    if (valor > comissaoAtual) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Comissão insuficiente' }) };
    }

    // Subtrai comissão e adiciona no saldo
    const novaComissao = comissaoAtual - valor;
    const novoSaldo = saldoAtual + valor;

    await pool.query('UPDATE usuarios SET comissao = $1, saldo = $2 WHERE email = $3', [novaComissao, novoSaldo, email]);

    // REGISTRA O PEDIDO NO HISTÓRICO
    await pool.query(
      'INSERT INTO saques (email, valor, carteira, rede, tipo, status, data) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [email, valor, carteira, rede, 'comissao', 'concluido']
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true }),
    };
  } catch (error) {
    console.error('Erro ao sacar comissão:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao processar saque de comissão' }),
    };
  }
};
