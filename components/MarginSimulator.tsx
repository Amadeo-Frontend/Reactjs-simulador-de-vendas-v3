import React, { useMemo, useState } from 'react';
import { Product, Sale, SaleItem, PriceKey } from '../types';
import { productsData } from '../data/products';
import { formatCurrency } from '../utils/money';

type Props = { onLogout: () => void };

const priceKeys: PriceKey[] = [
  'preco_venda_A',
  'preco_venda_B',
  'preco_venda_C',
  'preco_venda_D',
  'preco_venda', // Padrão (legado)
];

function getUnitPrice(p: Product, key: PriceKey) {
  const candidate = (p as any)?.[key];
  if (typeof candidate === 'number' && !Number.isNaN(candidate)) return candidate;
  // fallback legado
  const legacy = p.preco_venda;
  return typeof legacy === 'number' ? legacy : 0;
}

const MarginSimulator: React.FC<Props> = ({ onLogout }) => {
  const [priceKey, setPriceKey] = useState<PriceKey>('preco_venda_A');

  // inicia com alguns produtos e quantidades zeradas
  const [sale, setSale] = useState<Sale>({
    items: productsData.map((p) => ({
      ...p,
      quantity: 0,
      bonusQuantity: 0,
    })),
  });

  const handleQty = (idx: number, field: 'quantity' | 'bonusQuantity', v: number) => {
    setSale((old) => {
      const items = [...old.items];
      const it = { ...items[idx], [field]: Math.max(0, v) };
      items[idx] = it;
      return { ...old, items };
    });
  };

  const totals = useMemo(() => {
    let receita = 0;
    let custo = 0;
    let custoBonificacao = 0;

    sale.items.forEach((it) => {
      const preco = getUnitPrice(it, priceKey);
      const q = it.quantity || 0;
      const b = it.bonusQuantity || 0;

      receita += preco * q;

      const c = typeof it.custo === 'number' ? it.custo : 0;
      const cBonus = typeof it.bonificacao_unitaria === 'number' ? it.bonificacao_unitaria : 0;

      custo += c * q;
      custoBonificacao += cBonus * b;
    });

    const custoTotal = custo + custoBonificacao;
    const margemBruta = receita - custoTotal;
    const percMargem = receita > 0 ? (margemBruta / receita) * 100 : 0;

    // Quanto da margem (%) está sendo "consumida" pela bonificação
    const percMargemBonificada =
      receita > 0 ? (custoBonificacao / receita) * 100 : 0;

    return {
      receita,
      custo,
      custoBonificacao,
      custoTotal,
      margemBruta,
      percMargem,
      percMargemBonificada,
    };
  }, [sale, priceKey]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 mx-auto max-w-7xl h-14">
          <h1 className="text-lg font-semibold">Simulador de Margem</h1>
          <button
            onClick={onLogout}
            className="px-3 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="p-4 mx-auto space-y-6 max-w-7xl">
        {/* Seletor de preço A/B/C/D/Padrão */}
        <section className="p-4 border rounded-xl">
          <h2 className="mb-3 text-base font-medium">
            Preço de venda usado no cálculo
          </h2>
          <div className="flex flex-wrap gap-2">
            {priceKeys.map((k) => (
              <label
                key={k}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                  priceKey === k ? 'bg-slate-100 dark:bg-slate-800' : ''
                }`}
              >
                <input
                  type="radio"
                  name="priceKey"
                  value={k}
                  checked={priceKey === k}
                  onChange={() => setPriceKey(k)}
                />
                <span>
                  {k === 'preco_venda' ? 'Padrão (legado)' : k.replace('preco_venda_', 'Preço ')}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Se o produto não tiver o preço escolhido, o app usa o preço padrão (legado)
            automaticamente.
          </p>
        </section>

        {/* Tabela */}
        <section className="overflow-x-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-right">Venda Unit.</th>
                <th className="px-4 py-3 text-right">Custo Unit.</th>
                <th className="px-4 py-3 text-right">Bônus Unit.</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">Bônus</th>
                <th className="px-4 py-3 text-right">Receita</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((it, idx) => {
                const preco = getUnitPrice(it, priceKey);
                const receitaLinha = (it.quantity || 0) * preco;

                return (
                  <tr key={it.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3">{it.sku}</td>
                    <td className="px-4 py-3">{it.nome}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(preco)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(it.custo || 0)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(it.bonificacao_unitaria || 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        className="w-20 px-2 py-1 text-right bg-white border rounded dark:bg-slate-900"
                        type="number"
                        min={0}
                        value={it.quantity}
                        onChange={(e) => handleQty(idx, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        className="w-20 px-2 py-1 text-right bg-white border rounded dark:bg-slate-900"
                        type="number"
                        min={0}
                        value={it.bonusQuantity}
                        onChange={(e) => handleQty(idx, 'bonusQuantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(receitaLinha)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100/70 dark:bg-slate-800/70">
              <tr>
                <td className="px-4 py-3 font-medium" colSpan={7}>
                  Receita total
                </td>
                <td className="px-4 py-3 font-semibold text-right">
                  {formatCurrency(totals.receita)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Cards de métricas */}
        <section className="grid gap-4 md:grid-cols-3">
          <Stat label="Receita" value={formatCurrency(totals.receita)} />
          <Stat label="Custo (sem bônus)" value={formatCurrency(totals.custo)} />
          <Stat label="Custo Bonificação" value={formatCurrency(totals.custoBonificacao)} />
          <Stat label="Custo Total" value={formatCurrency(totals.custoTotal)} />
          <Stat label="Margem Bruta (R$)" value={formatCurrency(totals.margemBruta)} />
          <Stat label="Margem Bruta (%)" value={`${totals.percMargem.toFixed(2)}%`} />
          <Stat
            label="Margem consumida por Bônus (%)"
            value={`${totals.percMargemBonificada.toFixed(2)}%`}
          />
        </section>
      </main>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border rounded-xl">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export default MarginSimulator;
