import React, { useEffect, useMemo, useRef, useState } from "react";
import { Product, PriceKey, SaleItem } from "../types";
import { productsData } from "../data/products";

declare const jspdf: any;
declare const html2canvas: any;

/* ================= helpers ================= */

function stampFilename(prefix = "simulacao-margem") {
  const now = new Date();
  // yyyy-mm-dd_HH-mm-ss
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${prefix}_${y}-${m}-${d}_${hh}-${mm}-${ss}.pdf`;
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v
  );

const PRICE_KEYS: PriceKey[] = [
  "preco_venda_A",
  "preco_venda_B",
  "preco_venda_C",
];

function firstAvailablePriceKey(p?: Product): PriceKey {
  for (const k of PRICE_KEYS) {
    const v = (p as any)?.[k];
    if (typeof v === "number" && !Number.isNaN(v)) return k;
  }
  return "preco_venda_A";
}

function pickUnitPrice(p?: Product, key?: PriceKey) {
  if (!p) return 0;
  const k = key ?? firstAvailablePriceKey(p);
  const v = (p as any)[k];
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

function listPriceOptions(p?: Product) {
  const out: { value: PriceKey; label: string }[] = [];
  if (p) {
    for (const k of PRICE_KEYS) {
      const v = (p as any)[k];
      if (typeof v === "number" && !Number.isNaN(v)) {
        out.push({
          value: k,
          label: `Preço ${k.split("_").pop()} — ${fmtBRL(v)}`,
        });
      }
    }
  }
  return out.length
    ? out
    : [
        { value: "preco_venda_A", label: "Preço A" },
        { value: "preco_venda_B", label: "Preço B" },
        { value: "preco_venda_C", label: "Preço C" },
      ];
}

/* ================= tipos locais ================= */

type Row = SaleItem & {
  priceKey: PriceKey;
  bonusCashBRL: number; // bônus/desconto em R$
  // copiamos também os preços do produto para a linha:
  preco_venda_A?: number | null;
  preco_venda_B?: number | null;
  preco_venda_C?: number | null;
};

/* ================= Autocomplete SKU + nome (com spinner) ================= */

const ComboProduto: React.FC<{
  value?: Product;
  onChange: (p?: Product) => void;
}> = ({ value, onChange }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [sku, setSku] = useState<string>(value?.sku ?? "");
  const [q, setQ] = useState<string>(
    value ? `${value.nome} • ${value.sku}` : ""
  );
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  // sincroniza input quando valor externo muda
  useEffect(() => {
    setSku(value?.sku ?? "");
    setQ(value ? `${value.nome} • ${value.sku}` : "");
  }, [value]);

  // fechar ao clicar fora/ESC
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  // busca com debounce + spinner
  useEffect(() => {
    const term = q.trim().toLowerCase();
    setIsSearching(true);
    const t = setTimeout(() => {
      let arr = productsData;
      if (term) {
        arr = productsData.filter(
          (p) =>
            p.nome.toLowerCase().includes(term) ||
            String(p.sku).toLowerCase().includes(term)
        );
      }
      setResults(arr.slice(0, 10)); // limita a 10
      setIsSearching(false);
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
    const starts = productsData.find((p) =>
      String(p.sku).toLowerCase().startsWith(s)
    );
    const found =
      starts ??
      productsData.find((p) => String(p.sku).toLowerCase().includes(s));
    if (found) choose(found);
  };

  return (
    <div ref={wrapRef} className="space-y-2">
      <div className="flex items-end gap-3">
        {/* SKU curto */}
        <div className="w-24 md:w-28">
          <label className="block mb-1 text-xs text-muted-foreground">
            SKU
          </label>
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
          <label className="block mb-1 text-xs text-muted-foreground">
            Buscar por nome ou SKU
          </label>
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
              {isSearching ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Carregando…
                </div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Sem resultados
                </div>
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
      priceKey: "preco_venda_A",
      bonusCashBRL: 0,
      bonificacao_unitaria: 0,
      preco_venda_A: null,
      preco_venda_B: null,
      preco_venda_C: null,
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
        priceKey: "preco_venda_A",
        bonusCashBRL: 0,
        bonificacao_unitaria: 0,
        preco_venda_A: null,
        preco_venda_B: null,
        preco_venda_C: null,
      },
    ]);

  const removeRow = (idx: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, i) => i !== idx) : r));

  /* -------- cálculo por linha -------- */
  const lineCalc = (row: Row) => {
    // trate a linha como "produto" porque copiamos os preços A/B/C pra ela
    const product = row as unknown as Product;
    const unitPrice = pickUnitPrice(product, row.priceKey);
    const unitCost = row.custo || 0;

    const qSell = row.quantity || 0;
    const qBonus = row.bonusQuantity || 0;

    const receita = unitPrice * qSell;
    const cVendidos = unitCost * qSell;
    const cBonusProduto = unitCost * qBonus;
    const bonusCashBRL = row.bonusCashBRL || 0;

    const custoFinal = cVendidos + cBonusProduto + bonusCashBRL;
    const lucroLiquido = receita - custoFinal;

    const margemBrutaPct =
      receita > 0 ? ((receita - cVendidos) / receita) * 100 : 0;
    const margemLiquidaPct = receita > 0 ? (lucroLiquido / receita) * 100 : 0;

    const bonificadoPP = margemBrutaPct - margemLiquidaPct;
    const percMargemBrutaConsumida =
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
      percMargemBrutaConsumida,
    };
  };

  const perLine = rows.map(lineCalc);

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

  const custoFinalTotal =
    totals.cVendidos + totals.cBonusProduto + totals.cBonusCash;
  const lucroLiquidoTotal = totals.receita - custoFinalTotal;

  const margemBrutaTotalPct =
    totals.receita > 0
      ? ((totals.receita - totals.cVendidos) / totals.receita) * 100
      : 0;
  const margemLiquidaTotalPct =
    totals.receita > 0 ? (lucroLiquidoTotal / totals.receita) * 100 : 0;

  const bonificadoTotalPP = margemBrutaTotalPct - margemLiquidaTotalPct;
  const percMargemBrutaConsumidaTotal =
    margemBrutaTotalPct > 0
      ? (bonificadoTotalPP / margemBrutaTotalPct) * 100
      : 0;

  const exportPDF = async () => {
    const el = pdfRef.current;
    if (!el || !html2canvas || !jspdf) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#0f172a",
    });
    const img = canvas.toDataURL("image/png");
    const { jsPDF } = jspdf;
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    pdf.addImage(img, "PNG", x, y, w, h);

    // >>> aqui entra o nome com carimbo de data/hora
    pdf.save(stampFilename("simulacao-margem"));
  };

  return (
    <div className="container py-6 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Simulador de Margem</h1>
        <button
          onClick={() => {
            // mostra loader no App (se existir) e navega
            window.dispatchEvent(
              new CustomEvent("app:loading", { detail: true })
            );
            setTimeout(() => (window.location.href = "/"), 100);
          }}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Voltar ao menu
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* esquerda: linhas de venda */}
        <div className="space-y-4 lg:col-span-7">
          {rows.map((row, idx) => {
            const productSelected: Product | undefined = row.nome
              ? (row as unknown as Product)
              : undefined;
            const pOpts = listPriceOptions(productSelected);
            const lc = perLine[idx];

            return (
              <div
                key={idx}
                className="p-4 space-y-4 border rounded-xl border-border"
              >
                <div className="grid gap-4 md:grid-cols-12">
                  {/* SKU + Busca */}
                  <div className="md:col-span-7">
                    <ComboProduto
                      value={productSelected}
                      onChange={(p) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx
                              ? p
                                ? {
                                    ...r,
                                    // copia dados essenciais
                                    id: p.id,
                                    sku: p.sku,
                                    nome: p.nome,
                                    peso: p.peso,
                                    custo: p.custo ?? 0,
                                    // COPIA os preços A/B/C (ESSENCIAL p/ não zerar)
                                    preco_venda_A: p.preco_venda_A ?? null,
                                    preco_venda_B: p.preco_venda_B ?? null,
                                    preco_venda_C: p.preco_venda_C ?? null,
                                    // reseta quantidades/bonus
                                    quantity: 0,
                                    bonusQuantity: 0,
                                    bonusCashBRL: 0,
                                    // define preço padrão
                                    priceKey: firstAvailablePriceKey(p),
                                  }
                                : {
                                    // limpou o campo → zera a linha
                                    ...r,
                                    id: 0,
                                    sku: "",
                                    nome: "",
                                    peso: 0,
                                    custo: 0,
                                    preco_venda_A: null,
                                    preco_venda_B: null,
                                    preco_venda_C: null,
                                    quantity: 0,
                                    bonusQuantity: 0,
                                    bonusCashBRL: 0,
                                    priceKey: "preco_venda_A",
                                  }
                              : r
                          )
                        )
                      }
                    />
                  </div>

                  {/* preço A/B/C */}
                  <div className="md:col-span-5">
                    <label className="block mb-1 text-sm">Preço de venda</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background min-h-10"
                      value={row.priceKey}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx
                              ? { ...r, priceKey: e.target.value as PriceKey }
                              : r
                          )
                        )
                      }
                      disabled={!row.nome}
                    >
                      {pOpts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <div className="h-4 text-xs text-muted-foreground">
                      {!!row.nome && (
                        <>
                          Valor selecionado:{" "}
                          <strong>{fmtBRL(lc.unitPrice)}</strong>
                        </>
                      )}
                    </div>
                  </div>

                  {/* quantidades */}
                  <div className="md:col-span-3">
                    <label className="block mb-1 text-sm">Qtd. vendida</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background min-h-10"
                      value={row.quantity}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx
                              ? { ...r, quantity: Number(e.target.value || 0) }
                              : r
                          )
                        )
                      }
                    />
                    <div className="h-4" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block mb-1 text-sm">
                      Qtd. brinde (produto)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background min-h-10"
                      value={row.bonusQuantity}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  bonusQuantity: Number(e.target.value || 0),
                                }
                              : r
                          )
                        )
                      }
                    />
                    <div className="h-4" />
                  </div>

                  {/* custo unitário readonly */}
                  <div className="md:col-span-3">
                    <label className="block mb-1 text-sm">
                      Custo unitário (R$)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md outline-none cursor-not-allowed border-input bg-background min-h-10 opacity-80"
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
                      className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background min-h-10"
                      value={row.bonusCashBRL ?? 0}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  bonusCashBRL: Number(e.target.value || 0),
                                }
                              : r
                          )
                        )
                      }
                    />
                    <div className="h-4 text-xs text-muted-foreground">
                      Desconto / bonificação em dinheiro.
                    </div>
                  </div>
                </div>

                {/* mini-resumo linha */}
                <div className="grid gap-3 pt-3 text-sm border-t md:grid-cols-6 border-border">
                  <div>
                    <div className="text-muted-foreground">Receita</div>
                    <div className="font-semibold">{fmtBRL(lc.receita)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Custo vendidos</div>
                    <div className="font-semibold">{fmtBRL(lc.cVendidos)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Custo brinde (produto)
                    </div>
                    <div className="font-semibold">
                      {fmtBRL(lc.cBonusProduto)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Bônus em R$</div>
                    <div className="font-semibold">
                      {fmtBRL(lc.bonusCashBRL)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Lucro líquido</div>
                    <div className="font-semibold">
                      {fmtBRL(lc.lucroLiquido)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Margens</div>
                    <div className="font-semibold">
                      Bruta {lc.margemBrutaPct.toFixed(2)}% • Líquida{" "}
                      {lc.margemLiquidaPct.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Bonificado: {lc.bonificadoPP.toFixed(2)} p.p. • Consome{" "}
                      {lc.percMargemBrutaConsumida.toFixed(2)}% da margem bruta
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => removeRow(idx)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-50"
                    disabled={rows.length === 1}
                  >
                    Remover linha
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

        {/* direita: resumo sticky + PDF */}
        <div className="lg:col-span-5">
          <div
            ref={pdfRef}
            className="p-5 border rounded-xl border-border lg:sticky lg:top-20"
          >
            <h2 className="mb-3 text-lg font-semibold">Resumo (Total)</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground">
                  Receita (venda bruta)
                </div>
                <div className="font-semibold">{fmtBRL(totals.receita)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Custo dos vendidos</div>
                <div className="font-semibold">{fmtBRL(totals.cVendidos)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  Custo bônus (produto)
                </div>
                <div className="font-semibold">
                  {fmtBRL(totals.cBonusProduto)}
                </div>
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
                <div className="font-semibold">
                  {margemBrutaTotalPct.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Margem líquida</div>
                <div className="font-semibold">
                  {margemLiquidaTotalPct.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Bonificado (p.p.)</div>
                <div className="font-semibold">
                  {bonificadoTotalPP.toFixed(2)} p.p.
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  % da margem bruta consumida
                </div>
                <div className="font-semibold">
                  {percMargemBrutaConsumidaTotal.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
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
