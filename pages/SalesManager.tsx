// pages/SalesManager.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v
  );

type SaleListItem = {
  id: number;
  createdAtISO: string;
  itemsCount: number;
  receita: number;
  margemBruta: number;
  margemLiquida: number;
};

const SalesManager: React.FC = () => {
  const [items, setItems] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const r = await api("/api/sales");
      const list = (await r.json()) as SaleListItem[];
      setItems(list);
    } catch (e: any) {
      alert("Falha ao carregar vendas: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(`Excluir a venda #${id}?`)) return;
    try {
      await api(`/api/sales/${id}`, { method: "DELETE" });
      setItems((arr) => arr.filter((x) => x.id !== id));
    } catch (e: any) {
      alert("Falha ao excluir: " + e.message);
    }
  };

  const handlePrint = async (id: number) => {
    try {
      const r = await api(`/api/sales/${id}`);
      const sale = await r.json();

      // Reusa a mesma impressão cliente do simulador (gera HTML simples)
      const css = `
        :root{ --ink:#0b122a; --muted:#475569; --line:#e2e8f0; --pill:#f1f5f9; }
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;background:#fff;color:var(--ink);font:14px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
        .wrap{max-width:960px;margin:24px auto;padding:0 16px}
        h1{margin:0 0 6px 0;font-size:18px}
        .meta{color:var(--muted);font-size:12px;margin-bottom:12px}
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

      const linesHtml = (sale.items || [])
        .map((it: any) => {
          const faixa =
            it.tier === "Manual"
              ? "Manual"
              : `Faixa ${it.tier} • ${it.mode === "vista" ? "à vista" : "a prazo"}`;
          return `
            <tr>
              <td>${(it.nome || "-").replace(/</g, "&lt;")}</td>
              <td class="center">${it.sku || "-"}</td>
              <td class="center"><span class="pill">${faixa}</span></td>
              <td class="right">${fmtBRL(it.unitPrice || 0)}</td>
              <td class="center">${it.quantity || 0}</td>
              <td class="center">${it.bonusQuantity || 0}</td>
              <td class="right">${fmtBRL(it.bonusCashBRL || 0)}</td>
              <td class="right"><strong>${fmtBRL(
                (it.unitPrice || 0) * (it.quantity || 0)
              )}</strong></td>
            </tr>
          `;
        })
        .join("");

      const html = `<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <title>Comprovante_venda_${sale.id}</title>
          <style>${css}</style>
        </head>
        <body>
          <div class="wrap">
            <h1>Simulação de Venda #${sale.id}</h1>
            <div class="meta">Criada em ${new Date(
              sale.createdAtISO
            ).toLocaleString("pt-BR")}</div>

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
                  <td class="right">${fmtBRL(sale.totals?.receita || 0)}</td>
                </tr>
              </tfoot>
            </table>

            <div class="totals">
              <div class="card">
                <div style="color:#475569;font-size:12px">Margem bruta</div>
                <div class="big">${Number(sale.margins?.brutaPct || 0).toFixed(2)}%</div>
              </div>
              <div class="card">
                <div style="color:#475569;font-size:12px">Margem líquida</div>
                <div class="big">${Number(sale.margins?.liquidaPct || 0).toFixed(2)}%</div>
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
      a.download = `comprovante_venda_${sale.id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Falha ao imprimir: " + e.message);
    }
  };

  return (
    <div className="container py-6 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Gerenciar Vendas</h1>
        <div className="flex gap-2">
          <Link
            to="/simulador"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            Ir ao simulador
          </Link>
          <button
            onClick={load}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="overflow-hidden border rounded-xl border-border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-background/40">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th className="w-[90px]">ID</th>
                <th className="w-[200px]">Data</th>
                <th>Itens</th>
                <th className="w-[160px] text-right">Receita</th>
                <th className="w-[160px]">Margem bruta</th>
                <th className="w-[160px]">Margem líquida</th>
                <th className="w-[220px] text-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                    Carregando…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                    Nenhuma venda cadastrada ainda.
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{s.id}</td>
                    <td className="px-3 py-2">
                      {new Date(s.createdAtISO).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">{s.itemsCount}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(s.receita)}</td>
                    <td className="px-3 py-2">{s.margemBruta.toFixed(2)}%</td>
                    <td className="px-3 py-2">{s.margemLiquida.toFixed(2)}%</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePrint(s.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded-md border-border hover:bg-secondary"
                        >
                          Imprimir
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-400 border border-red-400 rounded-md hover:bg-red-400/10"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile (lista simples) */}
      <div className="mt-3 space-y-3 md:hidden">
        {loading ? (
          <div className="p-4 text-center border text-slate-400 rounded-xl border-border bg-card">
            Carregando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center border text-slate-400 rounded-xl border-border bg-card">
            Nenhuma venda cadastrada ainda.
          </div>
        ) : (
          items.map((s) => (
            <div key={s.id} className="p-4 border rounded-xl border-border bg-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">
                    ID {s.id} • {new Date(s.createdAtISO).toLocaleString("pt-BR")}
                  </div>
                  <div className="font-semibold">
                    {s.itemsCount} itens • Receita {fmtBRL(s.receita)}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    M. bruta {s.margemBruta.toFixed(2)}% • M. líquida{" "}
                    {s.margemLiquida.toFixed(2)}%
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint(s.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md border-border hover:bg-secondary"
                  >
                    Imprimir
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-400 border border-red-400 rounded-md hover:bg-red-400/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesManager;
