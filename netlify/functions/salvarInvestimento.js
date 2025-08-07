// salvarInvestimento.js

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Função para somar 1 minuto ao horário atual
function adicionarMinuto(data) {
  return new Date(data.getTime() + 1 * 60 * 1000); // 1 minuto em milissegundos
}

router.post('/', async (req, res) => {
  const { email, valor } = req.body;

  if (!email || !valor) {
    return res.status(400).json({ mensagem: 'Email e valor são obrigatórios.' });
  }

  const lucroPorMinuto = valor * 0.01; // 1% ao minuto
  const agora = new Date();
  const proximoPagamento = adicionarMinuto(agora); // Próximo lucro em 1 minuto

  try {
    const resultado = await pool.query(
      'INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, valor, lucroPorMinuto, proximoPagamento]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar investimento:', error);
    res.status(500).json({ mensagem: 'Erro interno ao salvar o investimento.' });
  }
});

module.exports = router;
