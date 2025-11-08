export type PriceKey =
  | 'preco_venda_A'
  | 'preco_venda_B'
  | 'preco_venda_C'
  | 'preco_venda_A_prazo'
  | 'preco_venda_B_prazo'
  | 'preco_venda_C_prazo';

export interface Product {
  id: number;
  sku: string;
  nome: string;
  peso: number;

  // preços à vista
  preco_venda_A?: number | null;
  preco_venda_B?: number | null;
  preco_venda_C?: number | null;

  // preços a prazo
  preco_venda_A_prazo?: number | null;
  preco_venda_B_prazo?: number | null;
  preco_venda_C_prazo?: number | null;

  // custo e bonificação
  custo: number | null;                 // custo unitário
  bonificacao_unitaria: number | null;  // custo do brinde, se houver
}

export interface SaleItem extends Product {
  quantity: number;       // quantidade vendida
  bonusQuantity: number;  // quantidade bonificada
}

export interface Sale {
  items: SaleItem[];
}
