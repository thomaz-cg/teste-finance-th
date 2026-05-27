# 💰 Finanças do Casal

App de controle financeiro pessoal para casais.

## Como fazer o deploy no Vercel (gratuito, ~5 minutos)

### Opção A — Upload direto (mais fácil)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita (pode usar Google)
2. Clique em **"Add New Project"**
3. Escolha **"Upload"** e envie esta pasta compactada
4. Clique em **Deploy**
5. Em 2 minutos seu app estará em `https://financas-casal.vercel.app` (ou similar)

### Opção B — Via GitHub (recomendado para atualizações fáceis)

1. Crie uma conta no [github.com](https://github.com)
2. Crie um repositório novo (pode ser privado)
3. Faça upload dos arquivos desta pasta
4. No Vercel, conecte o repositório GitHub
5. O Vercel detecta automaticamente que é um projeto React
6. Clique em **Deploy**

## Desenvolvendo localmente

```bash
npm install
npm start
```

Acesse `http://localhost:3000`

## Funcionalidades

- **Visão Geral** — resumo do mês, gráfico dos últimos 6 meses, últimos lançamentos
- **Lançamentos** — adicione gastos com categoria, responsável, data e valor
- **Gráficos** — pizza por categoria, barras por responsável
- **Orçamento** — defina limites por categoria e acompanhe o progresso

## Dados

Os dados ficam salvos no `localStorage` do navegador — ou seja, persistem entre sessões no mesmo dispositivo/browser.
