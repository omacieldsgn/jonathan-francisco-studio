# Jonathan Francisco Studio — Noir Signal App

Este é um aplicativo full-stack premium desenvolvido para o **Jonathan Francisco Studio** (Studio Jota), localizado no Centro de Novo Hamburgo/RS. O projeto conta com um fluxo de agendamento de alta performance, painel administrativo integrado, lista de espera inteligente e uma identidade visual refinada ("Noir Signal") de altíssimo padrão.

---

## 🏛️ Arquitetura do Projeto

O sistema foi estruturado de forma moderna, limpa e autossuficiente (sem necessidade de bancos de dados externos complexos):

*   **Frontend (SPA)**: Desenvolvido em **React 19** com **TypeScript** e **Vite**, estilizado com classes utilitárias do **Tailwind CSS**.
*   **Animações**: Combina **Motion** para transições de rotas e o poder do **GSAP ScrollTrigger** para revelações sutis e fluidas baseadas no scroll na página inicial.
*   **Backend (Express)**: Servidor Node.js em **server.ts** atuando como proxy para APIs seguras, regras de agendamento de conflitos, fila de espera e controle administrativo.
*   **Persistência**: Um banco de dados em arquivo JSON (`database.json`) com gravação e leitura de transações atômicas para evitar reservas duplicadas ou concorrência.

---

## 📂 Organização de Diretórios

```bash
├── database.json          # Banco de dados persistente (JSON)
├── package.json           # Dependências e scripts de automação de build/dev
├── server.ts              # Servidor Express full-stack (Rotas de API + Servidor Estático)
├── vite.config.ts         # Configuração do Vite para compilação estática
├── tsconfig.json          # Configurações do compilador TypeScript
├── .env.example           # Exemplo de variáveis de ambiente
├── src/
│   ├── main.tsx           # Ponto de entrada do React
│   ├── App.tsx            # Componente raiz, controle de rotas e animações GSAP
│   ├── index.css          # Ponto de entrada CSS unificado com Tailwind
│   ├── types.ts           # Definições de tipo globais do TypeScript
│   ├── custom.d.ts        # Declarações de ativos estáticos (.svg, .jpg, .JPG)
│   ├── home.JPG           # Imagem de capa editorial do estúdio
│   └── components/
│       ├── ClientFlow.tsx     # Fluxo passo-a-passo de agendamento do cliente (Serviço, Profissional, Data, Confirmar)
│       ├── MyReservations.tsx # Área de consulta de reservas por WhatsApp/Telefone
│       ├── AdminPanel.tsx     # Painel de controle administrativo completo (Métricas, Agendamentos, Cupons)
│       └── WaitlistForm.tsx   # Interface para cadastro na lista de espera
```

---

## 🚀 Como Executar Localmente

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor estará disponível em `http://localhost:3000`.

---

## 📦 Build de Produção e Deploy

O projeto está configurado para empacotar o backend e o frontend em uma única pasta otimizada para produção (`dist/`).

### 1. Compilar o Projeto
```bash
npm run build
```
Este comando executa:
1. `vite build` — Compila o frontend em ativos HTML/JS/CSS estáticos dentro de `dist/`.
2. `esbuild server.ts --bundle ...` — Transpila e empacota o servidor Express em um único arquivo CommonJS ultra-rápido chamado `dist/server.cjs`.

### 2. Iniciar em Produção
```bash
npm start
```
Isso inicia o servidor Express diretamente de `dist/server.cjs` na porta `3000` escutando em `0.0.0.0` para ingressos de redes em nuvem.

---

## 🔑 Credenciais Administrativas

Para acessar o painel de gerenciamento (no botão **Administrador** no rodapé ou no cabeçalho):
*   **E-mail**: `contato@macieldsgn.com`
*   **Senha**: `admin123`

---

## ✨ Características Premium Implementadas
*   **Noir Signal Palette**: Visual grafite escuro elegante, tons areia e off-white refinados, tipografia Playfair Display (Serif) para cabeçalhos e Plus Jakarta Sans para leitura confortável.
*   **GSAP ScrollTrigger**: Revelação sob demanda de elementos ao rolar a tela principal, garantindo uma experiência interativa sofisticada.
*   **Validação de Slot Concorrente**: Bloqueio de gravação em milissegundos para impedir que dois clientes escolham simultaneamente o mesmo horário.
