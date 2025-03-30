
# DriverDash - Backend

Backend em Node.js para a aplicação DriverDash, um sistema de registro e análise de viagens para motoristas.

## Requisitos

- Node.js (versão 14 ou superior)
- MySQL (versão 5.7 ou superior)

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente:
   ```
   cp .env.example .env
   ```
4. Configure o banco de dados MySQL:
   ```
   mysql -u seu_usuario -p < db/setup.sql
   ```

## Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

- `PORT`: Porta em que o servidor será executado
- `DB_HOST`: Host do banco de dados MySQL
- `DB_USER`: Usuário do banco de dados
- `DB_PASSWORD`: Senha do banco de dados
- `DB_NAME`: Nome do banco de dados
- `JWT_SECRET`: Chave secreta para geração de tokens JWT
- `JWT_EXPIRES_IN`: Tempo de expiração dos tokens JWT

## Executando o Servidor

Para iniciar o servidor em modo de desenvolvimento:

```
npm run dev
```

Para iniciar o servidor em modo de produção:

```
npm start
```

## Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login de usuário

### Viagens
- `GET /api/trips` - Listar todas as viagens do usuário
- `GET /api/trips/:id` - Obter detalhes de uma viagem
- `POST /api/trips` - Registrar nova viagem
- `PUT /api/trips/:id` - Atualizar viagem existente
- `DELETE /api/trips/:id` - Excluir viagem

### Dashboard
- `GET /api/dashboard/summary` - Obter resumo e dados para o dashboard

## Estrutura do Projeto

```
backend/
├── config/         # Configurações (banco de dados, etc.)
├── db/             # Scripts de banco de dados
├── middleware/     # Middlewares (autenticação, etc.)
├── routes/         # Rotas da API
├── .env            # Variáveis de ambiente (não versionado)
├── .env.example    # Exemplo de variáveis de ambiente
├── package.json    # Dependências e scripts
├── README.md       # Este arquivo
└── server.js       # Ponto de entrada
```
