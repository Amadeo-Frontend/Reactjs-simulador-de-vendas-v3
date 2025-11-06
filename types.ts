export type PriceKey =
  | 'preco_venda'
  | 'preco_venda_A'
  | 'preco_venda_B'
  | 'preco_venda_C'
  | 'preco_venda_D';

export interface Product {
  id: number;
  sku: string;
  nome: string;
  peso: number;

  // legado (opcional)
  preco_venda?: number | null;

  // novos (opcionais)
  preco_venda_A?: number | null;
  preco_venda_B?: number | null;
  preco_venda_C?: number | null;
  preco_venda_D?: number | null;

  // custo e bonificação
  custo: number | null;                 // custo unitário
  bonificacao_unitaria: number | null;  // custo do brinde/bonificação por unidade (se aplicável)
}

export interface SaleItem extends Product {
  quantity: number;        // quantidade vendida
  bonusQuantity: number;   // quantidade bonificada (0 se não houver)
}

export interface Sale {
  items: SaleItem[];
}
