const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.handler = async (event) => {
  try {
    const { email, valor } = JSON.parse(event.body);

    const { rows } = await pool.query('SELECT comissao, saldo FROM usuarios WHERE email = $1', [email]);
    if (rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
    }

    const comissaoAtual = parseFloat(rows[0].comissao);
    const saldoAtual = parseFloat(rows[0].saldo);

    if (valor > comissaoAtual) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Comissão insuficiente' }) };
    }

    const novaComissao = comissaoAtual - valor;
    const novoSaldo = saldoAtual + valor;

    await pool.query('UPDATE usuarios SET comissao = $1, saldo = $2 WHERE email = $3', [novaComissao, novoSaldo, email]);

    // Registra como saque de comissão concluído
    await pool.query(
      'INSERT INTO saques (email, valor, tipo, status, data) VALUES ($1, $2, $3, $4, NOW())',
      [email, valor, 'comissao', 'concluido']
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
