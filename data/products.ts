import { Product } from '../types';

export const productsData: Product[] = [
  {
    id: 1,
    sku: '7001',
    nome: 'Snow Dog Especial 22% 7kg',
    peso: 7,
    // legado (fallback se A/B/C/D ausentes)
    preco_venda: 100.0,

    // novos preços (preencher só os que você tiver)
    preco_venda_A: 98.0,
    preco_venda_B: 95.0,
    preco_venda_C: 92.0,
    preco_venda_D: null,

    custo: 65.0,
    bonificacao_unitaria: 0.0
  },
  {
    id: 2,
    sku: '7002',
    nome: 'Lunch Dog Premium 15kg',
    peso: 15,
    preco_venda: 189.9,

    preco_venda_A: 185.9,
    preco_venda_B: 179.9,
    preco_venda_C: null,
    preco_venda_D: null,

    custo: 132.5,
    bonificacao_unitaria: 0.0
  },
  // adicione os demais...
];
