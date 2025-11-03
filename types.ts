export interface Product {
  id: number;
  sku: string;
  nome: string;
  peso: number;
  preco_venda: number;
  custo: number | null;
  bonificacao_unitaria: number | null;
}

export interface SaleItem extends Product {
  quantity: number;
  bonusQuantity: number;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  cashBonus: number;
}