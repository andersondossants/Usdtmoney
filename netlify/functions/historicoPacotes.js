const { connectDB } = require('./_db'); // seu módulo de conexão com banco

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);
  if (!email) return { statusCode: 400, body: "Email é obrigatório" };

  const db = await connectDB();
  const pacotes = await db.collection("pacotes").find({ email }).toArray();

  return {
    statusCode: 200,
    body: JSON.stringify(pacotes)
  };
};
