const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  const { referenciador, valorComissao } = JSON.parse(event.body);

  if (!referenciador || !valorComissao) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Dados incompletos" }),
    };
  }

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("plataforma");
  const users = db.collection("usuarios");

  await users.updateOne(
    { email: referenciador },
    { $inc: { comissao: valorComissao } }
  );

  await client.close();
  return {
    statusCode: 200,
    body: JSON.stringify({ status: "Comissão adicionada" })
  };
};
