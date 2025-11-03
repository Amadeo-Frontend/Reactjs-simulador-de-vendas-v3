# Simulador de Margem de Venda

Esta é uma aplicação web construída com React e TypeScript para simular a margem de lucro em vendas de produtos. A ferramenta permite adicionar múltiplos produtos, incluir bonificações (tanto em produtos quanto em dinheiro), gerenciar múltiplas simulações de venda simultaneamente e exportar o resultado consolidado em um arquivo PDF.

## Funcionalidades Principais

-   **Autenticação de Usuário**: Tela de login para proteger o acesso à ferramenta.
-   **Busca de Produtos**: Campo de busca para encontrar produtos por nome ou SKU.
-   **Múltiplas Vendas**: Capacidade de adicionar e gerenciar várias simulações de venda em paralelo.
-   **Cálculo Detalhado**: Adição de quantidade de venda, quantidade de bônus (por produto) e bônus em dinheiro (por venda).
-   **Resumo Consolidado**: Um card de resultados que calcula e exibe em tempo real a receita total, custos, lucro e a margem de lucro final de todas as vendas.
-   **Exportação para PDF**: Funcionalidade para gerar um relatório em PDF com o resumo da simulação.
-   **Tema Claro/Escuro**: Botão para alternar entre os modos de visualização claro e escuro.
-   **Design Responsivo**: A interface se adapta para uma ótima experiência em desktops e dispositivos móveis.

---

## Como Rodar o Projeto Localmente

Para baixar e executar este projeto em sua máquina, você precisará do [Node.js](https://nodejs.org/) (que inclui o `npm`). Siga os passos abaixo.

### Passo 1: Criar o Projeto com Vite

A maneira mais recomendada de configurar um ambiente de desenvolvimento React moderno é usando o Vite.

1.  Abra seu terminal e navegue até o diretório onde deseja salvar o projeto.
2.  Execute o seguinte comando para criar um novo projeto React com TypeScript:
    ```bash
    npm create vite@latest simulador-de-margem -- --template react-ts
    ```
3.  Acesse o diretório do projeto recém-criado:
    ```bash
    cd simulador-de-margem
    ```

### Passo 2: Copiar os Arquivos do Projeto

Agora, você precisa substituir os arquivos de exemplo do Vite pelos arquivos desta aplicação.

1.  **Apague** todo o conteúdo da pasta `src` que foi criada pelo Vite.
2.  **Copie** todas as pastas e arquivos do nosso projeto (`components`, `data`, `hooks`, `App.tsx`, `index.tsx`, `types.ts`) para dentro da pasta `src`.
3.  **Substitua** o arquivo `index.html` na raiz do projeto pelo nosso.
4.  Renomeie o arquivo `src/index.tsx` para `src/main.tsx` (padrão do Vite).

### Passo 3: Instalar as Dependências

Com os arquivos no lugar, instale as bibliotecas necessárias.

1.  Execute `npm install` para instalar as dependências padrão (React, etc.).
    ```bash
    npm install
    ```
2.  Instale as bibliotecas para exportação de PDF:
    ```bash
    npm install jspdf html2canvas
    ```
3.  Instale e configure o Tailwind CSS para estilização:
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```

### Passo 4: Configurar o Tailwind CSS

1.  Abra o arquivo `tailwind.config.js` e substitua seu conteúdo por este:

    ```javascript
    /** @type {import('tailwindcss').Config} */
    export default {
      content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
      ],
      darkMode: 'class',
      theme: {
        extend: {
           colors: {
              primary: {"50":"#eff6ff","100":"#dbeafe","200":"#bfdbfe","300":"#93c5fd","400":"#60a5fa","500":"#3b82f6","600":"#2563eb","700":"#1d4ed8","800":"#1e40af","900":"#1e3a8a","950":"#172554"}
            }
        },
      },
      plugins: [],
    }
    ```

2.  Crie um novo arquivo em `src/index.css` e adicione as diretivas do Tailwind:

    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    body {
        @apply bg-slate-50 dark:bg-slate-900 transition-colors duration-300;
    }
    ```

3.  No topo do seu arquivo `src/main.tsx`, importe o arquivo CSS:

    ```javascript
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    import './index.css'; // Adicione esta linha
    ```

### Passo 5: Rodar o Aplicativo

Tudo pronto! Para iniciar o servidor de desenvolvimento, execute:

```bash
npm run dev
```

O terminal exibirá um endereço local (como `http://localhost:5173`). Abra-o em seu navegador para ver o aplicativo funcionando.

---

## Entendendo e Modificando a Regra de Cálculo

A lógica de cálculo é a alma da aplicação. Para facilitar a manutenção, ela foi centralizada em um único local.

**Arquivo:** `src/components/MarginSimulator.tsx`
**Componente:** `ResultsSummary`

Dentro deste componente, utilizamos o hook `useMemo` para garantir que os cálculos sejam refeitos apenas quando os dados das vendas mudam. É aqui que você deve fazer qualquer alteração.

### Detalhes da Lógica de Cálculo

1.  **Receita Bruta Total (`totalRevenue`)**: Soma do `preço de venda` multiplicado pela `quantidade vendida` de todos os produtos em todas as vendas.

2.  **Custo Final (`finalCost`)**: É a soma de três componentes:
    *   **Custo dos Produtos Vendidos**: `custo` x `quantidade vendida`.
    *   **Custo dos Bônus em Produto**: `custo` x `quantidade de bônus`.
    *   **Custo dos Bônus em Dinheiro**: Soma de todos os bônus em R$ inseridos.

3.  **Lucro Bruto (`profit`)**: A diferença entre a receita e o custo final.
    *   `Lucro Bruto = Receita Bruta Total - Custo Final`

4.  **Margem Final (`finalMargin`)**: A porcentagem do lucro em relação à receita.
    *   `Margem Final (%) = (Lucro Bruto / Receita Bruta Total) * 100`

### Bloco de Código para Modificação

Abaixo está o trecho exato do código onde os cálculos são realizados. Para alterar qualquer regra, modifique as fórmulas dentro deste bloco.

```javascript
// Dentro do componente ResultsSummary em src/components/MarginSimulator.tsx

const { totalRevenue, totalProductCost, totalBonusCost, totalCashBonus, finalCost, profit, finalMargin } = useMemo(() => {
    let totalRevenue = 0;
    let totalProductCost = 0;
    let totalBonusCost = 0;
    let totalCashBonus = 0;

    // 1. Loop por cada venda para somar os valores
    for (const sale of sales) {
        // Receita Bruta
        totalRevenue += sale.items.reduce((acc, item) => acc + (item.preco_venda * item.quantity), 0);
        
        // Custo dos Produtos Vendidos
        totalProductCost += sale.items.reduce((acc, item) => acc + ((item.custo ?? 0) * item.quantity), 0);
        
        // Custo dos Produtos em Bônus
        totalBonusCost += sale.items.reduce((acc, item) => acc + ((item.custo ?? 0) * item.bonusQuantity), 0);
        
        // Soma dos Bônus em Dinheiro
        totalCashBonus += sale.cashBonus;
    }
    
    // 2. Cálculo dos totais
    const finalCost = totalProductCost + totalBonusCost + totalCashBonus;
    const profit = totalRevenue - finalCost;
    const finalMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // 3. Retorno dos valores calculados para exibição
    return { totalRevenue, totalProductCost, totalBonusCost, totalCashBonus, finalCost, profit, finalMargin };
}, [sales]);

```
