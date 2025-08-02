const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'data.json');

exports.handler = async (event) => {
  const { email, valor } = JSON.parse(event.body);
  const raw = fs.readFileSync(filePath);
  const db = JSON.parse(raw);

  // Atualizar status do depósito
  const dep = db.depositos.find(d => d.email === email && d.valor == valor && d.status === "pendente");
  if (dep) dep.status = "aprovado";

  // Atualizar saldo do usuário
  const user = db.users.find(u => u.email === email);
  if (user) user.saldo = parseFloat(user.saldo) + parseFloat(valor);

  fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Depósito aprovado" })
  };
};
