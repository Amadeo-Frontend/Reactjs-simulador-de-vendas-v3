// pages/MarginSimulator.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tag, Trash2 } from "lucide-react";

/* ================= Tipos ================= */
export interface Product {
  id: number;
  sku: string;
  nome: string;
  peso: number | null;
  // à vista
  preco_venda_A?: number | null;
  preco_venda_B?: number | null;
  preco_venda_C?: number | null;
  // a prazo
  preco_venda_A_prazo?: number | null;
  preco_venda_B_prazo?: number | null;
  preco_venda_C_prazo?: number | null;
  custo: number | null;
  bonificacao_unitaria?: number | null;
}

export interface SaleItem {
  id: number;
  sku: string;
  nome: string;
  peso: number | null;
  custo: number | null;
  quantity: number;
  bonusQuantity: number;
}

/* ================= API helper (mesmo do app) ================= */
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://server-simulador-de-vendas-v3.onrender.com";

async function api(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url, {
    credentials: "include",
    headers:
      init?.body != null
        ? { "Content-Type": "application/json", ...(init?.headers || {}) }
        : { ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(t || `HTTP ${r.status}`);
  }
  return r;
}

/* ================= helpers ================= */
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v
  );

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

type FixedChoice = {
  tier: Tier;
  mode: Mode;
};

function displayOptionLabel(p: Partial<Product>, tier: Tier, mode: Mode) {
  const key =
    mode === "vista" ? `preco_venda_${tier}` : `preco_venda_${tier}_prazo`;
  const v = (p as any)?.[key];
  const price =
    typeof v === "number" && !Number.isNaN(v) ? fmtBRL(v) : "(sem preço)";
  return `Faixa ${tier} • ${
    mode === "vista" ? "à vista" : "a prazo"
  } — ${price}`;
}

function getPrice(p: Partial<Product>, tier: Tier, mode: Mode): number {
  const key =
    mode === "vista" ? `preco_venda_${tier}` : `preco_venda_${tier}_prazo`;
  const v = (p as any)?.[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

/* ===== cores de margens ===== */
function pctColor(pct: number, base: "bruta" | "liquida" = "bruta") {
  if (pct < 0) return "text-red-500";
  return base === "bruta" ? "text-emerald-600" : "text-blue-600";
}

/* ================= tipos locais ================= */
type Row = SaleItem & {
  // seleção fixa OU preço manual
  fixedChoice: FixedChoice | null;
  manualPrice: number | null;

  bonusCashBRL: number;

  // cópias dos preços do produto
  preco_venda_A?: number | null;
  preco_venda_B?: number | null;
  preco_venda_C?: number | null;
  preco_venda_A_prazo?: number | null;
  preco_venda_B_prazo?: number | null;
  preco_venda_C_prazo?: number | null;
};

declare const jspdf: any;
declare const html2canvas: any;

/* ================= Autocomplete ================= */
const ComboProduto: React.FC<{
  products: Product[];
  value?: Product;
  onChange: (p?: Product) => void;
}> = ({ products, value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [sku, setSku] = useState<string>(value?.sku ?? "");
  const [q, setQ] = useState<string>(
    value ? `${value.nome} • ${value.sku}` : ""
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    setSku(value?.sku ?? "");
    setQ(value ? `${value.nome} • ${value.sku}` : "");
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
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

  // debounce 250ms + limite 10
  useEffect(() => {
    const term = q.trim().toLowerCase();
    setLoading(true);
    const t = setTimeout(() => {
      let arr = products;
      if (term) {
        arr = products.filter(
          (p) =>
            p.nome?.toLowerCase().includes(term) ||
            String(p.sku || "")
              .toLowerCase()
              .includes(term)
        );
      }
      setResults(arr.slice(0, 10));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, products]);

  const choose = (p: Product) => {
    setSku(p.sku || "");
    setQ(`${p.nome} • ${p.sku}`);
    setOpen(false);
    onChange(p);
  };

  const trySelectBySku = (raw: string) => {
    const s = raw.trim().toLowerCase();
    if (!s) return;
    const starts =
      products.find((p) =>
        String(p.sku || "")
          .toLowerCase()
          .startsWith(s)
      ) ||
      products.find((p) =>
        String(p.sku || "")
          .toLowerCase()
          .includes(s)
      );
    if (starts) choose(starts);
  };

  return (
    <div ref={ref} className="space-y-2">
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
              {loading ? (
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
  const rowRefs = useRef<HTMLDivElement[]>([]);
  const navigate = useNavigate();

  // nome da empresa do cliente (manual)
  const [clientCompany, setClientCompany] = useState<string>("");

  // produtos
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setProdLoading(true);
        const r = await api("/api/products");
        const list: Product[] = await r.json();
        setProducts(list);
      } catch {
        alert("Falha ao carregar produtos do servidor.");
      } finally {
        setProdLoading(false);
      }
    })();
  }, []);

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
      fixedChoice: null,
      manualPrice: null,
      preco_venda_A: null,
      preco_venda_B: null,
      preco_venda_C: null,
      preco_venda_A_prazo: null,
      preco_venda_B_prazo: null,
      preco_venda_C_prazo: null,
    },
  ]);

  // ======= cálculo =======
  function unitPriceOf(row: Row): number {
    if (row.manualPrice && row.manualPrice > 0) return row.manualPrice;
    const choice = row.fixedChoice;
    if (!choice) return 0;
    return getPrice(row, choice.tier, choice.mode);
  }

  const perLine = rows.map((row) => {
    const unitPrice = unitPriceOf(row);
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
  });

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
  const percMargemConsumidaTotal =
    margemBrutaTotalPct > 0
      ? (bonificadoTotalPP / margemBrutaTotalPct) * 100
      : 0;

  // ======= PDF helper =======
  async function withLightMode<T>(fn: () => Promise<T>) {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    if (hadDark) root.classList.remove("dark");
    try {
      return await fn();
    } finally {
      if (hadDark) root.classList.add("dark");
    }
  }

  const exportPDF = async () => {
    const el = pdfRef.current;
    if (!el || !html2canvas || !jspdf) return;

    await withLightMode(async () => {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
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
    });
  };

  // ======= Comprovante HTML (cliente) =======
  function printStamp(prefix = "venda") {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${prefix}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

  function openSalesPrintableHTML() {
    const css = `
      :root{ --ink:#0b122a; --muted:#475569; --line:#e2e8f0; --pill:#f1f5f9; }
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff;color:var(--ink);font:14px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
      .wrap{max-width:960px;margin:24px auto;padding:0 16px}
      h1{margin:0 0 6px 0;font-size:18px}
      .meta{color:var(--muted);font-size:12px;margin-bottom:12px}
      .meta div{margin-bottom:2px}
      table{width:100%;border-collapse:collapse}
      th,td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left}
      thead th{font-size:12px;color:#334155;background:#f8fafc}
      tfoot td{font-weight:600}
      .right{text-align:right}
      .center{text-align:center}
      .pill{display:inline-block;background:var(--pill);border:1px solid var(--line);padding:2px 6px;border-radius:999px;font-size:11px}
      .totals{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
      .card{border:1px solid var(--line);border-radius:10px;padding:12px}
      .big{font-size:16px;font-weight:700}
      @media print{ .no-print{display:none} }
    `;

    const linesHtml = rows
      .map((r, i) => {
        const c = perLine[i];
        // descobrir rótulo da faixa
        let faixa = "Manual";
        if (r.fixedChoice) {
          faixa = `Faixa ${r.fixedChoice.tier} • ${
            r.fixedChoice.mode === "vista" ? "à vista" : "a prazo"
          }`;
        }
        const unit = c.unitPrice;
        return `
          <tr>
            <td>${r.nome ? r.nome.replace(/</g, "&lt;") : "-"}</td>
            <td class="center">${r.sku || "-"}</td>
            <td class="center"><span class="pill">${faixa}</span></td>
            <td class="right">${fmtBRL(unit)}</td>
            <td class="center">${r.quantity || 0}</td>
            <td class="center">${r.bonusQuantity || 0}</td>
            <td class="right">${fmtBRL(r.bonusCashBRL || 0)}</td>
            <td class="right"><strong>${fmtBRL(c.receita)}</strong></td>
          </tr>
        `;
      })
      .join("");

    const safeCompany =
      clientCompany && clientCompany.trim().length > 0
        ? clientCompany.replace(/</g, "&lt;")
        : "";

    const html = `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Comprovante_${printStamp()}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="wrap">
          <h1>Simulação de Venda (Comprovante)</h1>
         <div class="meta">
         ${safeCompany ? `<div>Empresa cliente: ${safeCompany}</div>` : ""}
         <div>Gerado em ${new Date().toLocaleString("pt-BR")} — Arquivo: ${printStamp(
        "comprovante"
         )}.html</div>
       </div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th class="center">SKU</th>
                <th class="center">Faixa/Modo</th>
                <th class="right">Preço unit.</th>
                <th class="center">Qtd</th>
                <th class="center">Brinde (unid)</th>
                <th class="right">Bônus (R$)</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${
                linesHtml ||
                `<tr><td colspan="8" class="center" style="padding:18px;color:#64748b">Sem itens.</td></tr>`
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="7" class="right">Receita total</td>
                <td class="right">${fmtBRL(totals.receita)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="totals">
            <div class="card">
              <div style="color:#475569;font-size:12px">Margem bruta</div>
              <div class="big">${margemBrutaTotalPct.toFixed(2)}%</div>
            </div>
            <div class="card">
              <div style="color:#475569;font-size:12px">Margem líquida</div>
              <div class="big">${margemLiquidaTotalPct.toFixed(2)}%</div>
            </div>
          </div>

          <div class="no-print" style="margin-top:14px">
            <button onclick="window.print()" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#0ea5e9;color:#fff;cursor:pointer">
              Imprimir
            </button>
          </div>
        </div>
        <script>window.addEventListener('load',()=>window.print&&window.print())</script>
      </body>
    </html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${printStamp("comprovante")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ======= Ações =======
  const addRow = () => {
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
        fixedChoice: null,
        manualPrice: null,
        preco_venda_A: null,
        preco_venda_B: null,
        preco_venda_C: null,
        preco_venda_A_prazo: null,
        preco_venda_B_prazo: null,
        preco_venda_C_prazo: null,
      },
    ]);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = rowRefs.current[rowRefs.current.length - 1];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
  };

  const removeRow = (idx: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, i) => i !== idx) : r));

  // Salvar em /api/sales e abrir impressão
  const saveAndPrint = async () => {
    try {
      // monta payload
      const items = rows.map((r, i) => {
        const c = perLine[i];
        const choice = r.fixedChoice;
        const labelTier = choice ? choice.tier : "Manual";
        const labelMode = choice ? choice.mode : "vista";
        return {
          sku: r.sku,
          nome: r.nome,
          tier: labelTier,
          mode: labelMode,
          unitPrice: c.unitPrice,
          quantity: r.quantity || 0,
          bonusQuantity: r.bonusQuantity || 0,
          bonusCashBRL: r.bonusCashBRL || 0,
        };
      });

      const body = {
        items,
        totals: { receita: totals.receita },
        margins: {
          brutaPct: margemBrutaTotalPct,
          liquidaPct: margemLiquidaTotalPct,
        },
        // se quiser salvar o nome da empresa no futuro, pode incluir aqui:
        // clientCompany,
      };

      await api("/api/sales", { method: "POST", body: JSON.stringify(body) });

      // abre impressão HTML (cliente)
      openSalesPrintableHTML();

      // opcional: ir para a página de vendas
      // navigate("/vendas");
    } catch (e: any) {
      alert("Falha ao salvar a venda: " + e.message);
    }
  };

  return (
    <div className="container py-6 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Simulador de Margem</h1>
        <div className="flex gap-2">
          <Link
            to="/vendas"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            Gerenciar Vendas
          </Link>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            Voltar ao menu
          </Link>
        </div>
      </div>

      {prodLoading ? (
        <div className="p-4 text-center border rounded-xl border-border bg-card">
          Carregando produtos…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* esquerda: vendas */}
          <div className="space-y-4 lg:col-span-7">
            {rows.map((row, idx) => {
              const hasProduct = !!row.nome;
              const currentUnit = perLine[idx].unitPrice;
              const noPrice = hasProduct && currentUnit === 0;

              // opções do dropdown único (A/B/C × vista/prazo)
              const options: FixedChoice[] = [
                { tier: "A", mode: "vista" },
                { tier: "A", mode: "prazo" },
                { tier: "B", mode: "vista" },
                { tier: "B", mode: "prazo" },
                { tier: "C", mode: "vista" },
                { tier: "C", mode: "prazo" },
              ];

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    if (el) rowRefs.current[idx] = el;
                  }}
                  className={
                    "relative space-y-4 rounded-xl border p-4 " +
                    (noPrice
                      ? "border-red-300 dark:border-red-400/60"
                      : "border-border")
                  }
                >
                  <span className="absolute -top-3 left-3 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:ring-indigo-800">
                    <Tag size={12} className="shrink-0" />
                    Venda {idx + 1}
                  </span>

                  <div className="grid gap-4 md:grid-cols-12">
                    {/* seletor produto */}
                    <div className="md:col-span-7">
                      <ComboProduto
                        products={products}
                        value={
                          hasProduct
                            ? {
                                id: row.id,
                                sku: row.sku,
                                nome: row.nome,
                                peso: row.peso,
                                custo: row.custo,
                                preco_venda_A: row.preco_venda_A,
                                preco_venda_B: row.preco_venda_B,
                                preco_venda_C: row.preco_venda_C,
                                preco_venda_A_prazo: row.preco_venda_A_prazo,
                                preco_venda_B_prazo: row.preco_venda_B_prazo,
                                preco_venda_C_prazo: row.preco_venda_C_prazo,
                              }
                            : undefined
                        }
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
                                      peso: p.peso ?? 0,
                                      custo: p.custo ?? 0,
                                      // copia preços
                                      preco_venda_A: p.preco_venda_A ?? null,
                                      preco_venda_B: p.preco_venda_B ?? null,
                                      preco_venda_C: p.preco_venda_C ?? null,
                                      preco_venda_A_prazo:
                                        p.preco_venda_A_prazo ?? null,
                                      preco_venda_B_prazo:
                                        p.preco_venda_B_prazo ?? null,
                                      preco_venda_C_prazo:
                                        p.preco_venda_C_prazo ?? null,
                                      // reset de seleção e manual
                                      fixedChoice: null,
                                      manualPrice: null,
                                      // zera entradas
                                      quantity: 0,
                                      bonusQuantity: 0,
                                      bonusCashBRL: 0,
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
                                      fixedChoice: null,
                                      manualPrice: null,
                                      quantity: 0,
                                      bonusQuantity: 0,
                                      bonusCashBRL: 0,
                                    }
                                : r
                            )
                          )
                        }
                      />
                    </div>

                    {/* seletor único (todas as faixas) + preço manual */}
                    <div className="md:col-span-5">
                      <label className="block mb-1 text-xs text-muted-foreground">
                        Preço (selecione uma faixa ou digite manual)
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className={
                            "min-h-10 w-full rounded-md border px-3 py-2 text-sm outline-none " +
                            (noPrice
                              ? "border-red-400"
                              : "border-input bg-background")
                          }
                          value={
                            row.fixedChoice
                              ? `${row.fixedChoice.tier}-${row.fixedChoice.mode}`
                              : ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            setRows((rs) =>
                              rs.map((r, i) =>
                                i === idx
                                  ? v
                                    ? {
                                        ...r,
                                        fixedChoice: {
                                          tier: v.split("-")[0] as Tier,
                                          mode: v.split("-")[1] as Mode,
                                        },
                                        manualPrice: null, // zera manual ao escolher faixa
                                      }
                                    : { ...r, fixedChoice: null }
                                  : r
                              )
                            );
                          }}
                          disabled={!hasProduct}
                        >
                          <option value="">— Selecionar faixa —</option>
                          {options.map((opt) => (
                            <option
                              key={`${opt.tier}-${opt.mode}`}
                              value={`${opt.tier}-${opt.mode}`}
                            >
                              {displayOptionLabel(row, opt.tier, opt.mode)}
                            </option>
                          ))}
                        </select>

                        <input
                          inputMode="decimal"
                          placeholder="Preço manual (R$)"
                          className="w-full px-3 py-2 text-sm border rounded-md outline-none min-h-10 border-input bg-background"
                          value={row.manualPrice ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(",", ".").trim();
                            const n =
                              raw === ""
                                ? null
                                : Number.isFinite(+raw)
                                ? +raw
                                : null;
                            setRows((rs) =>
                              rs.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      manualPrice: n,
                                      fixedChoice: n ? null : r.fixedChoice, // se digitou, zera seleção
                                    }
                                  : r
                              )
                            );
                          }}
                          disabled={!hasProduct}
                        />
                      </div>

                      <div className="flex items-center h-4 mt-1 text-xs text-muted-foreground">
                        {hasProduct ? (
                          noPrice ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              Defina um preço manual ou selecione uma faixa com
                              preço.
                            </span>
                          ) : (
                            <>
                              Valor em uso:{" "}
                              <strong>{fmtBRL(currentUnit)}</strong>
                              {rows[idx].manualPrice
                                ? " (manual)"
                                : rows[idx].fixedChoice
                                ? ` (Faixa ${rows[idx].fixedChoice.tier} • ${
                                    rows[idx].fixedChoice.mode === "vista"
                                      ? "à vista"
                                      : "a prazo"
                                  })`
                                : ""}
                            </>
                          )
                        ) : (
                          <>Selecione um produto.</>
                        )}
                      </div>
                    </div>

                    {/* qtds */}
                    <div className="md:col-span-3">
                      <label className="block mb-1 text-sm">Qtd. vendida</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="w-full px-3 py-2 border rounded-md outline-none min-h-10 border-input bg-background disabled:opacity-60"
                        value={row.quantity === 0 ? "" : row.quantity}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((r, i) =>
                              i === idx
                                ? {
                                    ...r,
                                    quantity: Number(e.target.value || 0),
                                  }
                                : r
                            )
                          )
                        }
                        disabled={!hasProduct || noPrice}
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
                        placeholder="0"
                        className="w-full px-3 py-2 border rounded-md outline-none min-h-10 border-input bg-background disabled:opacity-60"
                        value={row.bonusQuantity === 0 ? "" : row.bonusQuantity}
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
                        disabled={!hasProduct || noPrice}
                      />
                      <div className="h-4" />
                    </div>

                    {/* custo readonly */}
                    <div className="md:col-span-3">
                      <label className="block mb-1 text-sm">
                        Custo unitário (R$)
                      </label>
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
                        inputMode="decimal"
                        placeholder="0,00"
                        className="w-full px-3 py-2 border rounded-md outline-none min-h-10 border-input bg-background disabled:opacity-60"
                        value={row.bonusCashBRL === 0 ? "" : row.bonusCashBRL}
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
                            <div className="font-semibold">
                              {fmtBRL(lc.receita)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Custo vendidos
                            </div>
                            <div className="font-semibold">
                              {fmtBRL(lc.cVendidos)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Custo brinde
                            </div>
                            <div className="font-semibold">
                              {fmtBRL(lc.cBonusProduto)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Bônus em R$
                            </div>
                            <div className="font-semibold">
                              {fmtBRL(lc.bonusCashBRL)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Lucro líquido
                            </div>
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
                              Bonificado: {lc.bonificadoPP.toFixed(2)} p.p. •
                              Consome {lc.percMargemConsumida.toFixed(2)}% da
                              margem bruta
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

          {/* direita: resumo + ações */}
          <div className="lg:col-span-5">
            {/* input para nome da empresa do cliente */}
            <div className="mb-4">
              <label className="block mb-1 text-sm">
                Nome da empresa do cliente
              </label>
              <input
                type="text"
                placeholder="Empresa que está comprando as rações"
                className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Esse nome aparece no comprovante e no PDF da simulação.
              </p>
            </div>

            <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                onClick={saveAndPrint}
                className="px-4 py-2 border rounded-md border-border hover:bg-secondary"
              >
                Salvar & Imprimir
              </button>
              <button
                onClick={exportPDF}
                className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Exportar PDF
              </button>
            </div>

            <div
              ref={pdfRef}
              className="p-5 border rounded-xl border-border lg:sticky lg:top-20 bg-background"
            >
              <h2 className="mb-3 text-lg font-semibold">Resumo (Total)</h2>

              {clientCompany && (
                <div className="mb-3 text-sm">
                  <span className="text-muted-foreground">
                    Empresa cliente:{" "}
                  </span>
                  <span className="font-semibold">{clientCompany}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">
                    Receita (venda bruta)
                  </div>
                  <div className="font-semibold">{fmtBRL(totals.receita)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Custo dos vendidos
                  </div>
                  <div className="font-semibold">
                    {fmtBRL(totals.cVendidos)}
                  </div>
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
                  <div className="font-semibold">
                    {fmtBRL(totals.cBonusCash)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Custo final</div>
                  <div className="font-semibold">{fmtBRL(custoFinalTotal)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Lucro líquido</div>
                  <div
                    className={
                      "font-semibold " +
                      (lucroLiquidoTotal < 0 ? "text-red-500" : "")
                    }
                  >
                    {fmtBRL(lucroLiquidoTotal)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 mt-4 sm:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">Margem bruta</div>
                  <div
                    className={
                      "text-lg font-bold " +
                      pctColor(margemBrutaTotalPct, "bruta")
                    }
                  >
                    {margemBrutaTotalPct.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Margem líquida</div>
                  <div
                    className={
                      "text-lg font-bold " +
                      (margemLiquidaTotalPct < 20
                        ? "text-red-500"
                        : pctColor(margemLiquidaTotalPct, "liquida"))
                    }
                  >
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
                    {percMargemConsumidaTotal.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarginSimulator;
