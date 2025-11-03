import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Product, SaleItem, Sale } from '../types';
import { productsData } from '../data/products';
import Header from './Header';
import Card from './ui/Card';
import Input from './ui/Input';

declare const jspdf: any;
declare const html2canvas: any;

// Helper BRL
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/* ------------------------- Busca de produtos ------------------------- */
interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  addedProductIds: Set<number>;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect, addedProductIds }) => {
  const [query, setQuery] = useState('');
  const filteredProducts = useMemo(() => {
    if (!query) return [];
    return productsData
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }, [query]);

  return (
    <div className="relative">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar produto por nome ou SKU..."
      />
      {filteredProducts.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 overflow-auto bg-white border rounded-md shadow-lg dark:bg-slate-700 border-slate-300 dark:border-slate-600 max-h-60">
          {filteredProducts.map((product) => {
            const isDisabled = addedProductIds.has(product.id) || product.custo === null;
            return (
              <li key={product.id}>
                <button
                  onClick={() => {
                    onProductSelect(product);
                    setQuery('');
                  }}
                  disabled={isDisabled}
                  className={`w-full text-left px-4 py-2 ${
                    isDisabled
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'hover:bg-green-300/30 dark:hover:bg-green-900/30'
                  } text-slate-800 dark:text-slate-200`}
                >
                  <p className="font-semibold">{product.nome}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    SKU: {product.sku} — Custo:{' '}
                    {product.custo !== null ? formatCurrency(product.custo) : 'N/A'}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/* --------------------------- Tabela de itens --------------------------- */
interface SaleItemsTableProps {
  items: SaleItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onUpdateBonusQuantity: (id: number, bonusQuantity: number) => void;
  onRemoveItem: (id: number) => void;
}

const SaleItemsTable: React.FC<SaleItemsTableProps> = ({
  items,
  onUpdateQuantity,
  onUpdateBonusQuantity,
  onRemoveItem
}) => {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-slate-500 dark:text-slate-400">
        Nenhum produto adicionado a esta venda.
      </p>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs uppercase text-slate-700 bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-6 py-3">Produto</th>
              <th className="px-6 py-3">Custo Unit.</th>
              <th className="px-6 py-3">Venda Unit.</th>
              <th className="px-6 py-3">Qtd. Venda</th>
              <th className="px-6 py-3">Qtd. Bônus (Pacote)</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                <th className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                  {item.nome}
                </th>
                <td className="px-6 py-4">{formatCurrency(item.custo ?? 0)}</td>
                <td className="px-6 py-4">{formatCurrency(item.preco_venda)}</td>
                <td className="px-6 py-4">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateQuantity(item.id, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-20 text-center"
                    aria-label={`Quantidade de venda para ${item.nome}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <Input
                    type="number"
                    min="0"
                    value={item.bonusQuantity}
                    onChange={(e) =>
                      onUpdateBonusQuantity(item.id, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-20 text-center"
                    aria-label={`Quantidade de bônus para ${item.nome}`}
                  />
                </td>
                <td className="px-6 py-4 font-semibold">
                  {formatCurrency(item.preco_venda * item.quantity)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="font-medium text-red-600 dark:text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-4 md:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 space-y-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          >
            <p className="font-bold text-slate-800 dark:text-slate-100">{item.nome}</p>
            <div className="grid grid-cols-2 text-sm gap-x-4 gap-y-2">
              <span>
                Custo Unit.: <span className="font-medium">{formatCurrency(item.custo ?? 0)}</span>
              </span>
              <span>
                Venda Unit.: <span className="font-medium">{formatCurrency(item.preco_venda)}</span>
              </span>
              <span className="col-span-2">
                Total Venda:{' '}
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(item.preco_venda * item.quantity)}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Input
                label="Qtd. Venda"
                type="number"
                min="1"
                id={`quantity-${item.id}`}
                value={item.quantity}
                onChange={(e) =>
                  onUpdateQuantity(item.id, parseInt(e.target.value, 10) || 1)
                }
              />
              <Input
                label="Qtd. Bônus"
                type="number"
                min="0"
                id={`bonus-${item.id}`}
                value={item.bonusQuantity}
                onChange={(e) =>
                  onUpdateBonusQuantity(item.id, parseInt(e.target.value, 10) || 0)
                }
              />
            </div>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="w-full py-2 text-sm font-medium text-center text-red-600 rounded-md dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

/* ----------------------------- Resumo ----------------------------- */
interface ResultsSummaryProps {
  sales: Sale[];
}
const ResultsSummary: React.FC<ResultsSummaryProps> = ({ sales }) => {
  const {
    totalRevenue,
    totalProductCost,
    totalBonusCost,
    totalCashBonus,
    finalCost,
    profit,
    grossMargin,
    netMargin,
    bonifiedSharePP,
    bonifiedSharePctOfGross,
  } = useMemo(() => {
    let totalRevenue = 0;
    let totalProductCost = 0;
    let totalBonusCost = 0;
    let totalCashBonus = 0;

    for (const sale of sales) {
      totalRevenue += sale.items.reduce((acc, item) => acc + item.preco_venda * item.quantity, 0);
      totalProductCost += sale.items.reduce((acc, item) => acc + (item.custo ?? 0) * item.quantity, 0);
      totalBonusCost += sale.items.reduce((acc, item) => acc + (item.custo ?? 0) * item.bonusQuantity, 0);
      totalCashBonus += sale.cashBonus;
    }

    const finalCost = totalProductCost + totalBonusCost + totalCashBonus; // todos os custos
    const profit = totalRevenue - finalCost; // lucro líquido

    // Margens
    const grossMargin =
      totalRevenue > 0 ? ((totalRevenue - totalProductCost) / totalRevenue) * 100 : 0; // bruta
    const netMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0; // líquida (após bonificação)

    // Quanto da margem foi "comido" pela bonificação:
    const bonifiedSharePP = Math.max(0, grossMargin - netMargin); // em pontos percentuais
    const bonifiedSharePctOfGross =
      grossMargin > 0 ? (bonifiedSharePP / grossMargin) * 100 : 0; // % da margem bruta consumida

    return {
      totalRevenue,
      totalProductCost,
      totalBonusCost,
      totalCashBonus,
      finalCost,
      profit,
      grossMargin,
      netMargin,
      bonifiedSharePP,
      bonifiedSharePctOfGross,
    };
  }, [sales]);

  const getMarginColor = (m: number) =>
    m >= 30 ? 'text-green-500' : m >= 15 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
        Resultado da Simulação
      </h2>
      <div className="space-y-3 text-slate-700 dark:text-slate-300">
        <div className="flex items-center justify-between">
          <span>Total Venda:</span> <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Custo dos Produtos (vendidos):</span>{' '}
          <span>{formatCurrency(totalProductCost)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Custo Bônus (Produto):</span> <span>{formatCurrency(totalBonusCost)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Custo Bônus (R$):</span> <span>{formatCurrency(totalCashBonus)}</span>
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
          <span>Custo Final:</span> <span>{formatCurrency(finalCost)}</span>
        </div>
        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
          <span>Lucro Líquido:</span> <span>{formatCurrency(profit)}</span>
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        <div className="flex items-center justify-between">
          <span>Margem Bruta:</span> <span>{grossMargin.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Resultado da margem de lucro após a bonificação (Margem Líquida):</span>{' '}
          <span className={getMarginColor(netMargin)}>{netMargin.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Qual percentual da margem de lucro está sendo bonificado:</span>{' '}
          <span>
            {bonifiedSharePP.toFixed(2)} p.p.
            {' • '}
            {bonifiedSharePctOfGross.toFixed(1)}% da margem bruta
          </span>
        </div>

        <div className={`flex justify-between items-center text-2xl font-bold ${getMarginColor(netMargin)}`}>
          <span>Margem Final (Líquida):</span>
          <span>{netMargin.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------ Main ------------------------------ */
interface MarginSimulatorProps {
  onLogout: () => void;
}

const MarginSimulator: React.FC<MarginSimulatorProps> = ({ onLogout }) => {
  const [sales, setSales] = useState<Sale[]>([{ id: Date.now(), items: [], cashBonus: 0 }]);
  const pdfRef = useRef<HTMLDivElement>(null);

  const addSale = () =>
    setSales((prev) => [...prev, { id: Date.now(), items: [], cashBonus: 0 }]);

  const removeSale = (saleId: number) =>
    setSales((prev) => prev.filter((sale) => sale.id !== saleId));

  const updateCashBonus = (saleId: number, bonus: number) =>
    setSales((prev) =>
      prev.map((sale) =>
        sale.id === saleId ? { ...sale, cashBonus: Math.max(0, bonus) } : sale
      )
    );

  const addSaleItem = (saleId: number, product: Product) =>
    setSales((prev) =>
      prev.map((sale) => {
        if (sale.id !== saleId) return sale;
        const isAdded = sale.items.some((it) => it.id === product.id);
        if (product.custo === null || isAdded) return sale;
        const newItems = [...sale.items, { ...product, quantity: 1, bonusQuantity: 0 }];
        return { ...sale, items: newItems };
      })
    );

  const removeSaleItem = (saleId: number, itemId: number) =>
    setSales((prev) =>
      prev.map((sale) =>
        sale.id === saleId
          ? { ...sale, items: sale.items.filter((item) => item.id !== itemId) }
          : sale
      )
    );

  const updateSaleItemQuantity = (saleId: number, itemId: number, quantity: number) =>
    setSales((prev) =>
      prev.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              items: sale.items.map((item) =>
                item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
              ),
            }
          : sale
      )
    );

  const updateSaleItemBonusQuantity = (saleId: number, itemId: number, bonusQuantity: number) =>
    setSales((prev) =>
      prev.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              items: sale.items.map((item) =>
                item.id === itemId
                  ? { ...item, bonusQuantity: Math.max(0, bonusQuantity) }
                  : item
              ),
            }
          : sale
      )
    );

  const exportToPdf = useCallback(async () => {
    const input = pdfRef.current;
    if (!input) return;

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
      pdf.save(`simulacao_margem_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF', error);
    }
  }, []);

  const hasResults = useMemo(
    () => sales.some((sale) => sale.items.length > 0 || sale.cashBonus > 0),
    [sales]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <Header onLogout={onLogout} />
      <main className="container p-4 mx-auto md:p-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {sales.map((sale, index) => {
              const addedProductIds = new Set(sale.items.map((item) => item.id));
              return (
                <Card key={sale.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      Venda #{index + 1}
                    </h2>
                    {sales.length > 1 && (
                      <button
                        onClick={() => removeSale(sale.id)}
                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md dark:bg-red-900/50 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
                      >
                        Remover Venda
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
                        1. Adicionar Produtos
                      </h3>
                      <ProductSearch
                        onProductSelect={(product) => addSaleItem(sale.id, product)}
                        addedProductIds={addedProductIds}
                      />
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
                        2. Adicionar Bônus (R$)
                      </h3>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 50,00"
                        value={sale.cashBonus || ''}
                        onChange={(e) => {
                          // aceita vírgula
                          const v = e.target.value.replace(',', '.');
                          const n = Number(v);
                          updateCashBonus(sale.id, Number.isFinite(n) ? Math.max(0, n) : 0);
                        }}
                        aria-label={`Bonificação em reais para Venda #${index + 1}`}
                        className="max-w-xs"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Entra como custo no cálculo da margem líquida (após a bonificação).
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
                        Produtos na Venda
                      </h3>
                      <SaleItemsTable
                        items={sale.items}
                        onUpdateQuantity={(itemId, qty) =>
                          updateSaleItemQuantity(sale.id, itemId, qty)
                        }
                        onUpdateBonusQuantity={(itemId, bonusQty) =>
                          updateSaleItemBonusQuantity(sale.id, itemId, bonusQty)
                        }
                        onRemoveItem={(itemId) => removeSaleItem(sale.id, itemId)}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}

            <button
              onClick={addSale}
              className="w-full px-6 py-3 font-semibold text-blue-600 transition-all border-2 border-blue-400 border-dashed rounded-lg dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              + Adicionar Outra Venda
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-8 lg:sticky top-8">
              <Card ref={pdfRef} className="!p-8">
                <ResultsSummary sales={sales} />
              </Card>
              <button
                onClick={exportToPdf}
                disabled={!hasResults}
                className="w-full px-6 py-3 font-semibold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Exportar para PDF
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarginSimulator;
