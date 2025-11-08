import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Product, SaleItem } from "../types";
import { productsData } from "../data/products";
import { Tag, Trash2 } from "lucide-react";

declare const jspdf: any;
declare const html2canvas: any;

/* ================= helpers ================= */

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// yyyy-mm-dd_HH-MM-SS
function stampFilename(prefix = "simulacao-margem") {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${prefix}_${y}-${m}-${d}_${hh}-${mm}-${ss}.pdf`;
}

type Tier = "A" | "B" | "C";
type Mode = "vista" | "prazo";

function priceKeyFor(tier: Tier, mode: Mode) {
  return mode === "vista" ? `preco_venda_${tier}` : `preco_venda_${tier}_prazo`;
}

function pickUnitPrice(row: Partial<Product>, tier: Tier, mode: Mode): number {
  const key = priceKeyFor(tier, mode);
  const v = (row as any)?.[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

function hasAnyPrice(p?: Product) {
  if (!p) return false;
  const keys = [
    "preco_venda_A",
    "preco_venda_B",
    "preco_venda_C",
    "preco_venda_A_prazo",
    "preco_venda_B_prazo",
    "preco_venda_C_prazo",
  ] as const;
  return keys.some((k) => typeof (p as any)[k] === "number");
}

/* ================= tipos locais ================= */

type Row = SaleItem & {
  tier: Tier;       // A/B/C
  mode: Mode;       // vista/prazo
  bonusCashBRL: number;

  // cópias dos preços na própria linha
  preco_venda_A?: number | null;
  preco_venda_B?: number | null;
  preco_venda_C?: number | null;
  preco_venda_A_prazo?: number | null;
  preco_venda_B_prazo?: number | null;
  preco_venda_C_prazo?: number | null;
};

/* ================= Autocomplete com spinner ================= */

const ComboProduto: React.FC<{
  value?: Product;
  onChange: (p?: Product) => void;
}> = ({ value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [sku, setSku] = useState<string>(value?.sku ?? "");
  const [q, setQ] = useState<string>(value ? `${value.nome} • ${value.sku}` : "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    setSku(value?.sku ?? "");
    setQ(value ? `${value.nome} • ${value.sku}` : "");
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  // debounce 250ms + limite 10
  useEffect(() => {
    const term = q.trim().toLowerCase();
    setLoading(true);
    const t = setTimeout(() => {
      let arr = productsData;
      if (term) {
        arr = productsData.filter(
          (p) =>
            p.nome.toLowerCase().includes(term) ||
            String(p.sku).toLowerCase().includes(term)
        );
      }
      setResults(arr.slice(0, 10));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const choose = (p: Product) => {
    setSku(p.sku);
    setQ(`${p.nome} • ${p.sku}`);
    setOpen(false);
    onChange(p);
  };

  const trySelectBySku = (raw: string) => {
    const s = raw.trim().toLowerCase();
    if (!s) return;
    const starts = productsData.find((p) => String(p.sku).toLowerCase().startsWith(s));
    const found = starts ?? productsData.find((p) => String(p.sku).toLowerCase().includes(s));
    if (found) choose(found);
  };

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-end gap-3">
        {/* SKU curto */}
        <div className="w-24 md:w-28">
          <label className="block mb-1 text-xs text-muted-foreground">SKU</label>
          <input
            className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background min-h-10"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && trySelectBySku(sku)}
            onBlur={() => sku.trim() && trySelectBySku(sku)}
          />
          <div className="h-4" />
        </div>

        {/* Nome/SKU com dropdown */}
        <div className="relative flex-1">
          <label className="block mb-1 text-xs text-muted-foreground">Buscar por nome ou SKU</label>
          <input
            className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background min-h-10"
            placeholder="Buscar produto…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              if (!e.target.value.trim()) onChange(undefined);
            }}
            onFocus={() => setOpen(true)}
          />
          {open && (
            <div className="absolute z-30 w-full mt-1 overflow-auto border rounded-md shadow max-h-64 border-border bg-background">
              {loading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Carregando…</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Sem resultados</div>
              ) : (
                results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => choose(p)}
                    className="block w-full px-3 py-2 text-sm text-left hover:bg-secondary"
                  >
                    {p.nome} • {p.sku}
                  </button>
                ))
              )}
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

/* ================= componente principal ================= */

const MarginSimulator: React.FC = () => {
  const pdfRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<Row[]>([
    {
      id: 0,
      sku: "",
      nome: "",
      peso: 0,
      custo: 0,
      quantity: 0,
      bonusQuantity: 0,
      bonusCashBRL: 0,
      tier: "A",
      mode: "vista",

      bonificacao_unitaria: 0,

      preco_venda_A: null,
      preco_venda_B: null,
      preco_venda_C: null,
      preco_venda_A_prazo: null,
      preco_venda_B_prazo: null,
      preco_venda_C_prazo: null,
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
        quantity: 0,
        bonusQuantity: 0,
        bonusCashBRL: 0,
        tier: "A",
        mode: "vista",

        bonificacao_unitaria: 0,

        preco_venda_A: null,
        preco_venda_B: null,
        preco_venda_C: null,
        preco_venda_A_prazo: null,
        preco_venda_B_prazo: null,
        preco_venda_C_prazo: null,
      },
    ]);

  const removeRow = (idx: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, i) => i !== idx) : r));

  const calcLine = (row: Row) => {
    const unitPrice = pickUnitPrice(row, row.tier, row.mode);
    const unitCost = row.custo || 0;
    const qSell = row.quantity || 0;
    const qBonus = row.bonusQuantity || 0;

    const receita = unitPrice * qSell;
    const cVendidos = unitCost * qSell;
    const cBonusProduto = unitCost * qBonus;
    const bonusCashBRL = row.bonusCashBRL || 0;

    const custoFinal = cVendidos + cBonusProduto + bonusCashBRL;
    const lucroLiquido = receita - custoFinal;

    const margemBrutaPct = receita > 0 ? ((receita - cVendidos) / receita) * 100 : 0;
    const margemLiquidaPct = receita > 0 ? (lucroLiquido / receita) * 100 : 0;

    const bonificadoPP = margemBrutaPct - margemLiquidaPct;
    const percMargemConsumida =
      margemBrutaPct > 0 ? (bonificadoPP / margemBrutaPct) * 100 : 0;

    return {
      unitPrice,
      unitCost,
      receita,
      cVendidos,
      cBonusProduto,
      bonusCashBRL,
      custoFinal,
      lucroLiquido,
      margemBrutaPct,
      margemLiquidaPct,
      bonificadoPP,
      percMargemConsumida,
    };
  };

  const perLine = rows.map(calcLine);

  const totals = perLine.reduce(
    (acc, c) => {
      acc.receita += c.receita;
      acc.cVendidos += c.cVendidos;
      acc.cBonusProduto += c.cBonusProduto;
      acc.cBonusCash += c.bonusCashBRL;
      return acc;
    },
    { receita: 0, cVendidos: 0, cBonusProduto: 0, cBonusCash: 0 }
  );

  const custoFinalTotal = totals.cVendidos + totals.cBonusProduto + totals.cBonusCash;
  const lucroLiquidoTotal = totals.receita - custoFinalTotal;

  const margemBrutaTotalPct =
    totals.receita > 0 ? ((totals.receita - totals.cVendidos) / totals.receita) * 100 : 0;
  const margemLiquidaTotalPct =
    totals.receita > 0 ? (lucroLiquidoTotal / totals.receita) * 100 : 0;

  const bonificadoTotalPP = margemBrutaTotalPct - margemLiquidaTotalPct;
  const percMargemConsumidaTotal =
    margemBrutaTotalPct > 0 ? (bonificadoTotalPP / margemBrutaTotalPct) * 100 : 0;

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
    pdf.save(stampFilename("simulacao-margem"));
  };

  return (
    <div className="container py-6 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Simulador de Margem</h1>
        <Link
          to="/"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Voltar ao menu
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* esquerda: vendas */}
        <div className="space-y-4 lg:col-span-7">
          {rows.map((row, idx) => {
            const hasProduct = !!row.nome;
            const unitPrice = pickUnitPrice(row, row.tier, row.mode);
            const noPrice = hasProduct && unitPrice === 0;
            const disableInputs = !hasProduct || noPrice;

            return (
              <div
                key={idx}
                className={
                  "relative space-y-4 rounded-xl border p-4 " +
                  (noPrice ? "border-red-300 dark:border-red-400/60" : "border-border")
                }
              >
                {/* badge colorida “Venda N” com ícone */}
                <span
                  className="absolute -top-3 left-3 inline-flex items-center gap-1 rounded-full
                             bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700
                             ring-1 ring-inset ring-indigo-300
                             dark:bg-indigo-900/40 dark:text-indigo-200 dark:ring-indigo-800"
                >
                  <Tag size={12} className="shrink-0" />
                  Venda {idx + 1}
                </span>

                <div className="grid gap-4 md:grid-cols-12">
                  {/* seletor produto */}
                  <div className="md:col-span-7">
                    <ComboProduto
                      value={hasProduct ? (row as any as Product) : undefined}
                      onChange={(p) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx
                              ? p
                                ? {
                                    ...r,
                                    id: p.id,
                                    sku: p.sku,
                                    nome: p.nome,
                                    peso: p.peso,
                                    custo: p.custo ?? 0,
                                    // copia preços
                                    preco_venda_A: p.preco_venda_A ?? null,
                                    preco_venda_B: p.preco_venda_B ?? null,
                                    preco_venda_C: p.preco_venda_C ?? null,
                                    preco_venda_A_prazo: p.preco_venda_A_prazo ?? null,
                                    preco_venda_B_prazo: p.preco_venda_B_prazo ?? null,
                                    preco_venda_C_prazo: p.preco_venda_C_prazo ?? null,
                                    // zera entradas
                                    quantity: 0,
                                    bonusQuantity: 0,
                                    bonusCashBRL: 0,
                                    // reset seletores
                                    tier: "A",
                                    mode: "vista",
                                  }
                                : {
                                    ...r,
                                    id: 0,
                                    sku: "",
                                    nome: "",
                                    peso: 0,
                                    custo: 0,
                                    preco_venda_A: null,
                                    preco_venda_B: null,
                                    preco_venda_C: null,
                                    preco_venda_A_prazo: null,
                                    preco_venda_B_prazo: null,
                                    preco_venda_C_prazo: null,
                                    quantity: 0,
                                    bonusQuantity: 0,
                                    bonusCashBRL: 0,
                                    tier: "A",
                                    mode: "vista",
                                  }
                              : r
                          )
                        )
                      }
                    />
                  </div>

                  {/* seletores A/B/C + vista/prazo */}
                  <div className="md:col-span-5">
                    <label className="block mb-1 text-sm">Preço de venda</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className={
                          "min-h-10 w-full rounded-md border px-3 py-2 outline-none " +
                          (noPrice ? "border-red-400" : "border-input bg-background")
                        }
                        value={row.tier}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((r, i) =>
                              i === idx ? { ...r, tier: e.target.value as Tier } : r
                            )
                          )
                        }
                        disabled={!hasProduct}
                      >
                        <option value="A">Faixa A</option>
                        <option value="B">Faixa B</option>
                        <option value="C">Faixa C</option>
                      </select>

                      <select
                        className={
                          "min-h-10 w-full rounded-md border px-3 py-2 outline-none " +
                          (noPrice ? "border-red-400" : "border-input bg-background")
                        }
                        value={row.mode}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((r, i) =>
                              i === idx ? { ...r, mode: e.target.value as Mode } : r
                            )
                          )
                        }
                        disabled={!hasProduct}
                      >
                        <option value="vista">À vista</option>
                        <option value="prazo">A prazo</option>
                      </select>
                    </div>

                    <div className="h-4 text-xs">
                      {hasProduct ? (
                        noPrice ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            Não há preço cadastrado para <b>Faixa {row.tier}</b>{" "}
                            {row.mode === "vista" ? "à vista" : "a prazo"}. Selecione outra
                            combinação ou cadastre o preço no JSON.
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Valor selecionado: <strong>{fmtBRL(unitPrice)}</strong>
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Selecione um produto.</span>
                      )}
                    </div>
                  </div>

                  {/* qtds */}
                  <div className="md:col-span-3">
                    <label className="block mb-1 text-sm">Qtd. vendida</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border rounded-md outline-none min-h-10 border-input bg-background disabled:opacity-60"
                      value={row.quantity}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx ? { ...r, quantity: Number(e.target.value || 0) } : r
                          )
                        )
                      }
                      disabled={!hasProduct || noPrice}
                    />
                    <div className="h-4" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block mb-1 text-sm">Qtd. brinde (produto)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border rounded-md outline-none min-h-10 border-input bg-background disabled:opacity-60"
                      value={row.bonusQuantity}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx ? { ...r, bonusQuantity: Number(e.target.value || 0) } : r
                          )
                        )
                      }
                      disabled={!hasProduct || noPrice}
                    />
                    <div className="h-4" />
                  </div>

                  {/* custo readonly */}
                  <div className="md:col-span-3">
                    <label className="block mb-1 text-sm">Custo unitário (R$)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md outline-none cursor-not-allowed min-h-10 border-input bg-background opacity-80"
                      value={fmtBRL(row.custo ?? 0)}
                      readOnly
                    />
                    <div className="h-4" />
                  </div>

                  {/* bônus em R$ */}
                  <div className="md:col-span-3">
                    <label className="block mb-1 text-sm">Bônus em R$</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md outline-none min-h-10 border-input bg-background disabled:opacity-60"
                      value={row.bonusCashBRL ?? 0}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx ? { ...r, bonusCashBRL: Number(e.target.value || 0) } : r
                          )
                        )
                      }
                      disabled={!hasProduct || noPrice}
                    />
                    <div className="h-4 text-xs text-muted-foreground">
                      Desconto/bonificação em dinheiro.
                    </div>
                  </div>
                </div>

                {/* mini-resumo por linha */}
                <div className="grid gap-3 pt-3 text-sm border-t border-border md:grid-cols-6">
                  {(() => {
                    const lc = perLine[idx];
                    return (
                      <>
                        <div>
                          <div className="text-muted-foreground">Receita</div>
                          <div className="font-semibold">{fmtBRL(lc.receita)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Custo vendidos</div>
                          <div className="font-semibold">{fmtBRL(lc.cVendidos)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Custo brinde</div>
                          <div className="font-semibold">{fmtBRL(lc.cBonusProduto)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Bônus em R$</div>
                          <div className="font-semibold">{fmtBRL(lc.bonusCashBRL)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Lucro líquido</div>
                          <div className="font-semibold">{fmtBRL(lc.lucroLiquido)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Margens</div>
                          <div className="font-semibold">
                            Bruta {lc.margemBrutaPct.toFixed(2)}% • Líquida {lc.margemLiquidaPct.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Bonificado: {lc.bonificadoPP.toFixed(2)} p.p. • Consome{" "}
                            {lc.percMargemConsumida.toFixed(2)}% da margem bruta
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => removeRow(idx)}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-50"
                    disabled={rows.length === 1}
                    title="Remover linha"
                  >
                    <Trash2 size={16} />
                    Remover
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={addRow}
            className="px-4 py-2 text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
          >
            Adicionar venda
          </button>
        </div>

        {/* direita: resumo total (sticky) */}
        <div className="lg:col-span-5">
          <div ref={pdfRef} className="p-5 border rounded-xl border-border lg:sticky lg:top-20">
            <h2 className="mb-3 text-lg font-semibold">Resumo (Total)</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Receita (venda bruta)</div>
                <div className="font-semibold">{fmtBRL(totals.receita)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Custo dos vendidos</div>
                <div className="font-semibold">{fmtBRL(totals.cVendidos)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Custo bônus (produto)</div>
                <div className="font-semibold">{fmtBRL(totals.cBonusProduto)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bônus em R$</div>
                <div className="font-semibold">{fmtBRL(totals.cBonusCash)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Custo final</div>
                <div className="font-semibold">{fmtBRL(custoFinalTotal)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Lucro líquido</div>
                <div className="font-semibold">{fmtBRL(lucroLiquidoTotal)}</div>
              </div>
            </div>

            <div className="grid gap-4 mt-4 sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Margem bruta</div>
                <div className="font-semibold">{margemBrutaTotalPct.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Margem líquida</div>
                <div className="font-semibold">{margemLiquidaTotalPct.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bonificado (p.p.)</div>
                <div className="font-semibold">{bonificadoTotalPP.toFixed(2)} p.p.</div>
              </div>
              <div>
                <div className="text-muted-foreground">% da margem bruta consumida</div>
                <div className="font-semibold">{percMargemConsumidaTotal.toFixed(2)}%</div>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={exportPDF}
                className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarginSimulator;
