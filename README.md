# 🧠 Remember It API

API para gerenciamento de tarefas (to-do list) com autenticação de usuários. Desenvolvida com NestJS, Prisma e Docker.

---

## 📦 Tecnologias

- [NestJS](https://nestjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
- [JWT](https://jwt.io/)

---

## 🚀 Como rodar o projeto localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/remember-it-api.git
cd remember-it-api
```

### 2. Crie um arquivo `.env`

Crie o arquivo `.env` na raiz com o seguinte conteúdo:

```env
DATABASE_URL=postgresql://rememberit:rememberit@db:5432/rememberit
JWT_SECRET=super-secret-key
```

> 🔐 Substitua o valor do `JWT_SECRET` se desejar.

### 3. Suba os containers com Docker

```bash
docker-compose up --build
```

Isso iniciará:
- PostgreSQL na porta `5432`
- API NestJS na porta `3000`

### 4. Gere o client do Prisma e a migração

Se estiver rodando localmente:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Se estiver usando Docker, rode dentro do container:

```bash
docker exec -it remember-it-api npx prisma migrate dev --name init
```

---

## 🧪 Testando a API

### 📬 Criar usuário

**POST** `/users`

```json
{
  "email": "teste@email.com",
  "password": "123456"
}
```

### 🔐 Login

**POST** `/auth/login`

```json
{
  "email": "teste@email.com",
  "password": "123456"
}
```

> Retorna um token JWT.

### ✅ Tarefas (Autenticado)

Inclua o token JWT no header:

```
Authorization: Bearer SEU_TOKEN
```

#### Rotas disponíveis:

- `GET /tasks` – Lista tarefas
- `POST /tasks` – Cria uma tarefa
- `PATCH /tasks/:id` – Atualiza uma tarefa
- `DELETE /tasks/:id` – Remove uma tarefa

---

## 📁 Estrutura do Projeto

```
src/
├── auth/           → Módulo de autenticação (login, JWT, guards)
├── users/          → CRUD de usuários
├── tasks/          → CRUD de tarefas
├── prisma/         → Prisma service
├── app.module.ts   → Módulo principal
```

---

## 🛠 Comandos úteis

```bash
# Rodar em modo dev
npm run start:dev

# Instalar dependências
npm install

# Gerar client e aplicar migração
npx prisma migrate dev
npx prisma generate
```

---

## 📌 Observações

- O projeto está preparado para múltiplos usuários e usa autenticação JWT.
- Estrutura modular baseada nas boas práticas do NestJS.
- Dockerfile e docker-compose configurados para ambiente de desenvolvimento rápido.
