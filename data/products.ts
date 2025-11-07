import { Product } from '../types';

export const productsData: Product[] = [
  {
    id: 1,
    sku: '7001',
    nome: 'Snow Dog Especial 22% 7kg',
    peso: 7,
    preco_venda_A: 98.0,
    preco_venda_B: 95.0,
    preco_venda_C: 92.0,
    custo: 65.0,
    bonificacao_unitaria: 0.0,
  },
  {
    id: 2,
    sku: '7002',
    nome: 'Lunch Dog Premium 15kg',
    peso: 15,
    preco_venda_A: 185.9,
    preco_venda_B: 179.9,
    preco_venda_C: 0,     // se não tiver preço C, pode ser null ou remover
    custo: 132.5,
    bonificacao_unitaria: 0.0,
  },
];
