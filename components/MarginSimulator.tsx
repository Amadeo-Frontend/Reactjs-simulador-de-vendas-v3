import React, { useMemo, useRef, useState } from "react";
import { Product, PriceKey, SaleItem } from "../types";
import { productsData } from "../data/products";

declare const jspdf: any;
declare const html2canvas: any;

/* helpers */
const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PRICE_KEYS: PriceKey[] = [
  "preco_venda_A",
  "preco_venda_B",
  "preco_venda_C",
  "preco_venda_D",
  "preco_venda",
];

function resolveUnitPrice(p?: Product, key?: PriceKey) {
  if (!p) return 0;
  const k = key || "preco_venda";
  const raw = (p as any)[k];
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  for (const alt of PRICE_KEYS) {
    const v = (p as any)[alt];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return 0;
}

function priceOptions(p?: Product) {
  const list: { value: PriceKey; label: string }[] = [];
  if (!p) {
    return [
      { value: "preco_venda_A", label: "Preço A" },
      { value: "preco_venda_B", label: "Preço B" },
      { value: "preco_venda_C", label: "Preço C" },
      { value: "preco_venda_D", label: "Preço D" },
      { value: "preco_venda", label: "Preço (legado)" },
    ];
  }
  for (const k of PRICE_KEYS) {
    const v = (p as any)[k];
    if (typeof v === "number" && !Number.isNaN(v)) {
      list.push({
        value: k,
        label:
          k === "preco_venda"
            ? `Preço (legado) — ${formatCurrency(v)}`
            : `Preço ${k.split("_").pop()?.toUpperCase()} — ${formatCurrency(v)}`,
      });
    }
  }
  return list.length
    ? list
    : [
        { value: "preco_venda_A", label: "Preço A" },
        { value: "preco_venda_B", label: "Preço B" },
        { value: "preco_venda_C", label: "Preço C" },
        { value: "preco_venda_D", label: "Preço D" },
        { value: "preco_venda", label: "Preço (legado)" },
      ];
}

/* tipos */
type Row = SaleItem & {
  priceKey: PriceKey;
  /** bonificação fixa em reais (custo extra) */
  bonusValueBRL?: number;
};

const MarginSimulator: React.FC = () => {
  const pdfRef = useRef<HTMLDivElement>(null);

  /* busca */
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return productsData
      .filter((p) => p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  /* linhas */
  const [rows, setRows] = useState<Row[]>([
    {
      id: 0,
      sku: "",
      nome: "",
      peso: 0,
      custo: 0,
      bonificacao_unitaria: 0,
      quantity: 1,
      bonusQuantity: 0,
      priceKey: "preco_venda_A",
      bonusValueBRL: 0,
    },
  ]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      {
        id: 0,
        sku: "",
        nome: "",
        peso: 0,
        custo: 0,
        bonificacao_unitaria: 0,
        quantity: 1,
        bonusQuantity: 0,
        priceKey: "preco_venda_A",
        bonusValueBRL: 0,
      },
    ]);

  const removeRow = (idx: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, i) => i !== idx) : r));

  /* cálculo por linha */
  const computed = rows.map((r) => {
    const unitPrice = resolveUnitPrice(r as unknown as Product, r.priceKey);
    const sellQty = r.quantity || 0;
    const bonusQty = r.bonusQuantity || 0;

    const receita = unitPrice * sellQty;
    const custoTotal =
      (r.custo || 0) * (sellQty + bonusQty) +
      (r.bonificacao_unitaria || 0) * bonusQty +
      (r.bonusValueBRL || 0);

    const margemRS = receita - custoTotal;
    const margemPct = receita > 0 ? (margemRS / receita) * 100 : 0;

    return { r, unitPrice, receita, custoTotal, margemRS, margemPct };
  });

  const totals = computed.reduce(
    (acc, c) => {
      acc.receita += c.receita;
      acc.custo += c.custoTotal;
      return acc;
    },
    { receita: 0, custo: 0 }
  );
  const totalMargemRS = totals.receita - totals.custo;
  const totalMargemPct = totals.receita > 0 ? (totalMargemRS / totals.receita) * 100 : 0;

  /* PDF */
  const exportPDF = async () => {
    const el = pdfRef.current;
    if (!el || !html2canvas || !jspdf) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#0f172a" });
    const img = canvas.toDataURL("image/png");
    const { jsPDF } = jspdf;
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    pdf.save("simulacao-margem.pdf");
  };

  return (
    <div className="container py-6 mx-auto space-y-6">
      {/* Header local: apenas Voltar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Simulador de Margem</h1>
        <a
          href="/"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Voltar ao menu
        </a>
      </div>

      {/* Busca (preenche a última linha vazia) */}
      <div className="p-4 border rounded-xl border-border">
        <label className="block mb-1 text-sm">Buscar produto (nome ou SKU)</label>
        <input
          className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
          placeholder="Digite para buscar e clique em um item para preencher a linha selecionada…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <div className="grid gap-2 mt-2 sm:grid-cols-2">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setRows((rs) => {
                    const i = rs.findIndex((x) => !x.nome);
                    const idx = i === -1 ? rs.length - 1 : i;
                    const base = [...rs];
                    const opts = priceOptions(p);
                    base[idx] = {
                      ...base[idx],
                      ...(p as any),
                      priceKey: (opts[0]?.value || "preco_venda_A") as PriceKey,
                    };
                    return base;
                  });
                  setQuery("");
                }}
                className="px-3 py-2 text-left border rounded-md border-border hover:bg-secondary"
              >
                <div className="font-medium">{p.nome}</div>
                <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Linhas */}
      <div className="space-y-4">
        {rows.map((row, idx) => {
          const opts = priceOptions(row as any);
          const unitPrice = resolveUnitPrice(row as any, row.priceKey);

          return (
            <div key={idx} className="p-4 space-y-3 border rounded-xl border-border">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="space-y-1 sm:col-span-5">
                  <label className="text-sm">Produto</label>
                  <input
                    className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                    placeholder="— selecione pela busca acima —"
                    value={row.nome || ""}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, i) => (i === idx ? { ...r, nome: e.target.value } : r))
                      )
                    }
                  />
                  <div className="text-xs text-muted-foreground">
                    SKU:{" "}
                    <input
                      className="rounded border border-input bg-background px-2 py-0.5 outline-none text-xs w-32"
                      value={row.sku || ""}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) => (i === idx ? { ...r, sku: e.target.value } : r))
                        )
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm">Qtd. vendida</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                    value={row.quantity}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, i) =>
                          i === idx ? { ...r, quantity: Number(e.target.value || 0) } : r
                        )
                      )
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm">Qtd. bonificada</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                    value={row.bonusQuantity}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, i) =>
                          i === idx ? { ...r, bonusQuantity: Number(e.target.value || 0) } : r
                        )
                      )
                    }
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-sm">Preço de venda</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                    value={row.priceKey}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, i) =>
                          i === idx ? { ...r, priceKey: e.target.value as PriceKey } : r
                        )
                      )
                    }
                  >
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Selecionado: <strong>{formatCurrency(unitPrice)}</strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-3">
                  <label className="text-sm">Custo unitário (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                    value={row.custo ?? 0}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, i) => (i === idx ? { ...r, custo: Number(e.target.value || 0) } : r))
                      )
                    }
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-sm">Bonif. unitária (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                    value={row.bonificacao_unitaria ?? 0}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, i) =>
                          i === idx
                            ? { ...r, bonificacao_unitaria: Number(e.target.value || 0) }
                            : r
                        )
                      )
                    }
                  />
                  <div className="text-xs text-muted-foreground">
                    Multiplica a <b>Qtd. bonificada</b>.
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-sm">Bonificação (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                    value={row.bonusValueBRL ?? 0}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, i) =>
                          i === idx ? { ...r, bonusValueBRL: Number(e.target.value || 0) } : r
                        )
                      )
                    }
                  />
                  <div className="text-xs text-muted-foreground">
                    Valor fixo em reais (custo extra desta venda).
                  </div>
                </div>

                <div className="flex items-end justify-end sm:col-span-3">
                  <button
                    onClick={() => removeRow(idx)}
                    className="px-3 py-2 text-sm border rounded-md border-border hover:bg-secondary disabled:opacity-50"
                    disabled={rows.length === 1}
                  >
                    Remover
                  </button>
                </div>
              </div>

              {/* resultados da linha */}
              <div className="grid gap-3 pt-3 text-sm border-t sm:grid-cols-4 border-border">
                <div>
                  <div className="text-muted-foreground">Preço un.</div>
                  <div className="font-semibold">{formatCurrency(unitPrice)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Custo un.</div>
                  <div className="font-semibold">{formatCurrency(row.custo || 0)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Margem R$ (linha)</div>
                  <div className="font-semibold">
                    {formatCurrency(
                      unitPrice * (row.quantity || 0) -
                        ((row.custo || 0) * ((row.quantity || 0) + (row.bonusQuantity || 0)) +
                          (row.bonificacao_unitaria || 0) * (row.bonusQuantity || 0) +
                          (row.bonusValueBRL || 0))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Margem % (linha)</div>
                  <div className="font-semibold">
                    {(() => {
                      const receita = unitPrice * (row.quantity || 0);
                      const custo =
                        (row.custo || 0) *
                          ((row.quantity || 0) + (row.bonusQuantity || 0)) +
                        (row.bonificacao_unitaria || 0) * (row.bonusQuantity || 0) +
                        (row.bonusValueBRL || 0);
                      const m = receita > 0 ? ((receita - custo) / receita) * 100 : 0;
                      return `${m.toFixed(2)}%`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ações */}
      <div className="flex gap-3">
        <button
          onClick={addRow}
          className="px-4 py-2 text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
        >
          Adicionar venda
        </button>
        <button
          onClick={exportPDF}
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Exportar PDF
        </button>
      </div>

      {/* resumo (área do PDF) */}
      <div ref={pdfRef} className="p-5 border rounded-xl border-border">
        <h2 className="mb-3 text-lg font-semibold">Resumo</h2>
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Receita total</div>
            <div className="font-semibold">{formatCurrency(totals.receita)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Custo total</div>
            <div className="font-semibold">{formatCurrency(totals.custo)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Margem total</div>
            <div className="font-semibold">
              {formatCurrency(totalMargemRS)} ({totalMargemPct.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarginSimulator;
