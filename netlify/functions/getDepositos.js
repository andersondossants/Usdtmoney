const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'data.json');

exports.handler = async () => {
  const raw = fs.readFileSync(filePath);
  const db = JSON.parse(raw);

  return {
    statusCode: 200,
    body: JSON.stringify(db.depositos || [])
  };
};
