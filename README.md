# USDT Money

Plataforma de investimentos construída com:
- **Netlify** (deploy + functions serverless)
- **PostgreSQL Neon** (banco de dados)
- **Netlify Identity** para login e autenticação.

## Estrutura

- `index.html` — interface principal do painel.
- `netlify/functions/` — funções serverless:
  - `getSaldo.js`
  - `updateSaldo.js`
  - `getAllUsers.js`

## Como funciona

1. O usuário faz login usando **Netlify Identity**.
2. A função `getSaldo.js` busca o saldo no banco Neon.
3. O administrador pode usar `getAllUsers.js` para listar todos usuários.
4. `updateSaldo.js` altera o saldo diretamente no banco.

## Deploy

O projeto é publicado em [Netlify](https://www.netlify.com/) com build configurado:

```toml
[build]
  functions = "netlify/functions"
  publish = "."
