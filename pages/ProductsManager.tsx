// pages/ProductsManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  RefreshCw,
  Download,
  FileText,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
} from "lucide-react";

/* ===== API helper (envia credentials) ===== */
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
  return r;
}

/* ========= Tipos ========= */
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

type Draft = Omit<Product, "id"> & { id?: number };

/* ========= Utils ========= */
const toNumber = (v: string): number | null => {
  const s = v.replace(",", ".").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const money = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

/** Timestamp para nomes de arquivos */
const ts = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

/** ======== Exportadores (CLIENTE) ======== */
function productsToCSV(rows: Product[]) {
  const header = [
    "id",
    "sku",
    "nome",
    "peso",
    "preco_venda_A",
    "preco_venda_A_prazo",
    "preco_venda_B",
    "preco_venda_B_prazo",
    "preco_venda_C",
    "preco_venda_C_prazo",
    "custo",
    "bonificacao_unitaria",
  ];
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = rows.map((p) =>
    [
      p.id,
      p.sku,
      p.nome,
      p.peso,
      p.preco_venda_A,
      p.preco_venda_A_prazo,
      p.preco_venda_B,
      p.preco_venda_B_prazo,
      p.preco_venda_C,
      p.preco_venda_C_prazo,
      p.custo,
      p.bonificacao_unitaria,
    ]
      .map(esc)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function openPrintableHTML(rows: Product[], stamp: string) {
  const css = `
    :root{
      --bg:#0b1220; --card:#0e1627; --muted:#94a3b8; --border:#1f2a44;
      --head:#e2e8f0; --green:#053d2f; --green-soft:#e7fbf3;
      --yellow:#3d3005; --yellow-soft:#fff7e6; --sky:#0ea5e9;
    }
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:var(--bg);color:#e5e7eb;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial}
    .wrap{max-width:1200px;margin:16px auto;padding:0 12px}
    h1{margin:0 0 6px 0;font-size:22px}
    .meta{color:var(--muted);font-size:12px;margin-bottom:12px}
    .table-scroll{overflow:auto;border:1px solid var(--border);border-radius:12px;background:var(--card)}
    table{width:100%;border-collapse:separate;border-spacing:0;min-width:920px}
    thead th{position:sticky;top:0;z-index:2;background:#0f1930;color:var(--head);text-align:left;font-size:12px;letter-spacing:.02em}
    th,td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06)}
    tbody tr:nth-child(even){background-color:rgba(255,255,255,.02)}
    .num{text-align:right}
    .center{text-align:center}
    .w90{width:90px}
    .w110{width:110px}
    .badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#1f2a44;color:#cbd5e1;font-size:12px;margin-left:8px}
    .pill{display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;margin-right:6px;border:1px solid #1f2a44;color:#cbd5e1}
    .a{background:var(--green-soft)}
    .a th,.a td{background:var(--green-soft)}
    .c{background:var(--yellow-soft)}
    .c th,.c td{background:var(--yellow-soft)}
    /* em telas estreitas: mantemos o scroll horizontal da .table-scroll */
    @media print{
      .table-scroll{overflow:visible}
    }
  `;

  const fmt = (n?: number | null) =>
    typeof n === "number"
      ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";

  const head = `
    <thead>
      <tr>
        <th class="w90">ID</th>
        <th class="w110">SKU</th>
        <th>Produto</th>
        <th class="w90">Peso</th>
        <th class="center w110">À vista A</th>
        <th class="center w110">Prazo A</th>
        <th class="center w110">À vista B</th>
        <th class="center w110">Prazo B</th>
        <th class="center w110">À vista C</th>
        <th class="center w110">Prazo C</th>
        <th class="num w110">Custo</th>
      </tr>
    </thead>`;

  const body = rows
    .map(
      (p) => `
      <tr>
        <td>${p.id}</td>
        <td>${p.sku}</td>
        <td>${p.nome}</td>
        <td class="center">${p.peso ?? "—"}</td>
        <td class="center a">${fmt(p.preco_venda_A)}</td>
        <td class="center a">${fmt(p.preco_venda_A_prazo)}</td>
        <td class="center">${fmt(p.preco_venda_B)}</td>
        <td class="center">${fmt(p.preco_venda_B_prazo)}</td>
        <td class="center c">${fmt(p.preco_venda_C)}</td>
        <td class="center c">${fmt(p.preco_venda_C_prazo)}</td>
        <td class="num" style="color:#7dd3fc">${fmt(p.custo)}</td>
      </tr>`
    )
    .join("");

  const gerado = new Date().toLocaleString("pt-BR");

  const html = `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Produtos_${stamp}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="wrap">
        <h1>Produtos visíveis <span class="badge">${rows.length}</span></h1>
        <div class="meta">Gerado em: ${gerado} • Arquivo: produtos_${stamp}.html</div>
        <div class="table-scroll">
          <table>
            ${head}
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>
      <script>window.onload=()=>window.print&&window.print()</script>
    </body>
  </html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `produtos_${stamp}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ========= Formulário (Add/Edit) ========= */
function ProductForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Draft;
  onCancel: () => void;
  onSaved: (saved: Product) => void;
}) {
  const [form, setForm] = useState<Draft>(
    initial ?? {
      sku: "",
      nome: "",
      peso: null,
      preco_venda_A: null,
      preco_venda_B: null,
      preco_venda_C: null,
      preco_venda_A_prazo: null,
      preco_venda_B_prazo: null,
      preco_venda_C_prazo: null,
      custo: null,
      bonificacao_unitaria: null,
    }
  );
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  const numericKeys = new Set([
    "peso",
    "preco_venda_A",
    "preco_venda_B",
    "preco_venda_C",
    "preco_venda_A_prazo",
    "preco_venda_B_prazo",
    "preco_venda_C_prazo",
    "custo",
    "bonificacao_unitaria",
  ]);

  const bind = (key: keyof Draft) => {
    const val = form[key] as unknown;
    return {
      value:
        val === null || val === undefined
          ? ""
          : typeof val === "number"
          ? String(val)
          : (val as string),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setForm((f) => ({
          ...f,
          [key]: numericKeys.has(key as string) ? toNumber(v) : v,
        }));
      },
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku?.trim() || !form.nome?.trim()) {
      alert("Preencha pelo menos SKU e Nome.");
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify(form);
      if (isEdit) {
        const r = await api(`/api/products/${initial!.id}`, {
          method: "PUT",
          body,
        });
        if (!r.ok) throw new Error(await r.text());
        onSaved(await r.json());
      } else {
        const r = await api(`/api/products`, { method: "POST", body });
        if (!r.ok) throw new Error(await r.text());
        onSaved(await r.json());
      }
    } catch (err) {
      alert("Erro ao salvar: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const Label: React.FC<React.PropsWithChildren> = ({ children }) => (
    <label className="text-xs font-medium text-slate-400">{children}</label>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <Label>SKU</Label>
          <input
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            placeholder="SKU"
            {...bind("sku")}
          />
        </div>
        <div className="col-span-9">
          <Label>Nome</Label>
          <input
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            placeholder="Nome do produto"
            {...bind("nome")}
          />
        </div>

        <div className="col-span-3">
          <Label>Peso (kg)</Label>
          <input
            inputMode="decimal"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            placeholder="Ex.: 15"
            {...bind("peso")}
          />
        </div>

        <div className="col-span-3">
          <Label>À vista A</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("preco_venda_A")}
          />
        </div>
        <div className="col-span-3">
          <Label>À vista B</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("preco_venda_B")}
          />
        </div>
        <div className="col-span-3">
          <Label>À vista C</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("preco_venda_C")}
          />
        </div>

        <div className="col-span-3">
          <Label>A prazo A</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("preco_venda_A_prazo")}
          />
        </div>
        <div className="col-span-3">
          <Label>A prazo B</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("preco_venda_B_prazo")}
          />
        </div>
        <div className="col-span-3">
          <Label>A prazo C</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("preco_venda_C_prazo")}
          />
        </div>

        <div className="col-span-3">
          <Label>Custo (R$)</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("custo")}
          />
        </div>
        <div className="col-span-3">
          <Label>Bonificação unitária (R$)</Label>
          <input
            inputMode="decimal"
            placeholder="0,00"
            className="w-full px-3 py-2 border rounded-md bg-background border-input"
            {...bind("bonificacao_unitaria")}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md border-border hover:bg-secondary"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar"}
        </button>
      </div>
    </form>
  );
}

/* ========= Página ========= */
const ProductsManagement: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);

  // ====== IMPORTAÇÃO EM MASSA (JSON) ======
  const [showImport, setShowImport] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, ok: 0, fail: 0 });
  const [logs, setLogs] = useState<string[]>([]);

  const pushLog = (msg: string) => setLogs((l) => [msg, ...l].slice(0, 300));

  const normalizeItem = (raw: any): Draft | null => {
    if (!raw || typeof raw !== "object") return null;
    const {
      id, // descartamos
      sku,
      nome,
      peso = null,
      preco_venda_A = null,
      preco_venda_B = null,
      preco_venda_C = null,
      preco_venda_A_prazo = null,
      preco_venda_B_prazo = null,
      preco_venda_C_prazo = null,
      custo = null,
      bonificacao_unitaria = null,
      ...rest
    } = raw;

    if (!sku || !nome) return null;

    const num = (v: any) =>
      v === "" || v === undefined ? null : typeof v === "number" ? v : Number(v);

    const draft: Draft = {
      sku: String(sku),
      nome: String(nome),
      peso: num(peso),
      preco_venda_A: num(preco_venda_A),
      preco_venda_B: num(preco_venda_B),
      preco_venda_C: num(preco_venda_C),
      preco_venda_A_prazo: num(preco_venda_A_prazo),
      preco_venda_B_prazo: num(preco_venda_B_prazo),
      preco_venda_C_prazo: num(preco_venda_C_prazo),
      custo: num(custo),
      bonificacao_unitaria: num(bonificacao_unitaria),
      ...rest,
    };
    return draft;
  };

  const startImport = async () => {
    let parsed: any;
    setLogs([]);
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      alert("JSON inválido. Verifique a sintaxe.");
      return;
    }

    let arr: any[] = [];
    if (Array.isArray(parsed)) arr = parsed;
    else if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      arr = parsed.items;
    } else {
      alert("O JSON precisa ser um array de produtos ou { items: [...] }.");
      return;
    }

    const drafts = arr.map(normalizeItem).filter(Boolean) as Draft[];
    if (!drafts.length) {
      alert("Nenhum item válido encontrado (precisa ter ao menos sku e nome).");
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: drafts.length, ok: 0, fail: 0 });

    let ok = 0,
      fail = 0,
      done = 0;

    for (const d of drafts) {
      try {
        const r = await api("/api/products", {
          method: "POST",
          body: JSON.stringify(d),
        });
        if (!r.ok) {
          const t = await r.text();
          fail++;
          pushLog(`ERRO • SKU ${d.sku} • ${d.nome}: ${t || r.status}`);
        } else {
          const saved = await r.json();
          ok++;
          pushLog(`OK • ID ${saved.id} • ${saved.sku} • ${saved.nome}`);
        }
      } catch (e: any) {
        fail++;
        pushLog(`ERRO • SKU ${d.sku} • ${d.nome}: ${e?.message || "falha"}`);
      }
      done++;
      setProgress({ done, total: drafts.length, ok, fail });

      await new Promise((res) => setTimeout(res, 60));
    }

    setImporting(false);
    await load();
  };

  const load = async () => {
    try {
      setLoading(true);
      const r = await api("/api/products");
      if (!r.ok) throw new Error(await r.text());
      setItems(await r.json());
    } catch (err) {
      alert("Falha ao carregar produtos: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.nome?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        String(p.id).includes(q)
    );
  }, [items, query]);

  const onSaved = (saved: Product) => {
    setAdding(false);
    setEditing(null);
    setItems((curr) => {
      const idx = curr.findIndex((x) => x.id === saved.id);
      if (idx >= 0) {
        const cp = curr.slice();
        cp[idx] = saved;
        return cp;
      }
      return [saved, ...curr];
    });
  };

  const onDelete = async (p: Product) => {
    if (!confirm(`Excluir o produto "${p.nome}"?`)) return;
    try {
      const r = await api(`/api/products/${p.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
      setItems((list) => list.filter((x) => x.id !== p.id));
    } catch (err) {
      alert("Erro ao excluir: " + (err as Error).message);
    }
  };

  // Exportações visíveis (cliente)
  function handleCSVVisible() {
    try {
      const csv = productsToCSV(filtered);
      downloadText(`produtos_${ts()}.csv`, csv, "text/csv");
    } catch {
      alert("Falha ao gerar CSV");
    }
  }
  function handleHTMLVisible() {
    try {
      openPrintableHTML(filtered, ts());
    } catch {
      alert("Falha ao gerar HTML");
    }
  }

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-200 border border-slate-700">
            {filtered.length} visíveis
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCSVVisible}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md border-border hover:bg-secondary"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleHTMLVisible}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md border-border hover:bg-secondary"
          >
            <FileText className="w-4 h-4" />
            HTML / Imprimir
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-indigo-300 border border-indigo-400 rounded-md hover:bg-indigo-500/10"
          >
            <Upload className="w-4 h-4" />
            Importar JSON
          </button>

          <button
            onClick={async () => {
              try {
                setRefreshing(true);
                await load();
              } finally {
                setRefreshing(false);
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md border-border hover:bg-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setAdding(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Novo produto
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-3">
        <div className="relative max-w-md">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, SKU ou ID…"
            className="w-full py-2 pr-3 border rounded-md pl-9 bg-background border-input"
          />
        </div>
      </div>

      {/* Card de formulário */}
      {(adding || editing) && (
        <div className="p-4 mb-4 border rounded-xl border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">
              {editing ? "Editar produto" : "Novo produto"}
            </div>
            <button
              onClick={() => {
                setAdding(false);
                setEditing(null);
              }}
              className="inline-flex items-center gap-2 px-2 py-1 text-sm border rounded-md border-border hover:bg-secondary"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </div>
          <ProductForm
            initial={editing ?? undefined}
            onCancel={() => {
              setAdding(false);
              setEditing(null);
            }}
            onSaved={onSaved}
          />
        </div>
      )}

      {/* ====== DESKTOP (md+) ====== */}
      <div className="hidden overflow-hidden border md:block rounded-xl border-border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-background/40">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th className="w-[70px]">ID</th>
                <th className="w-[110px]">SKU</th>
                <th>Produto</th>
                <th className="w-[90px]">Peso</th>

                {/* PARES A, B, C */}
                <th className="text-center w-[120px] text-emerald-300">À vista A</th>
                <th className="text-center w-[120px] text-emerald-300/80">Prazo A</th>

                <th className="text-center w-[120px]">À vista B</th>
                <th className="text-center w-[120px]">Prazo B</th>

                <th className="text-center w-[120px] text-amber-300">À vista C</th>
                <th className="text-center w-[120px] text-amber-300/80">Prazo C</th>

                <th className="text-right w-[120px] text-sky-300">Custo</th>
                <th className="w-[140px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-3 py-6 text-center text-slate-400">
                    Carregando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-3 py-6 text-center text-slate-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{p.id}</td>
                    <td className="px-3 py-2 font-mono">{p.sku}</td>
                    <td className="px-3 py-2">{p.nome}</td>
                    <td className="px-3 py-2">{p.peso ?? "—"}</td>

                    {/* A */}
                    <td className="px-3 py-2 text-center">{money(p.preco_venda_A)}</td>
                    <td className="px-3 py-2 text-center">
                      {money(p.preco_venda_A_prazo)}
                    </td>
                    {/* B */}
                    <td className="px-3 py-2 text-center">{money(p.preco_venda_B)}</td>
                    <td className="px-3 py-2 text-center">
                      {money(p.preco_venda_B_prazo)}
                    </td>
                    {/* C */}
                    <td className="px-3 py-2 text-center">{money(p.preco_venda_C)}</td>
                    <td className="px-3 py-2 text-center">
                      {money(p.preco_venda_C_prazo)}
                    </td>

                    <td className="px-3 py-2 text-right text-sky-300">{money(p.custo)}</td>

                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setAdding(false);
                            setEditing(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded-md border-border hover:bg-secondary"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(p)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-400 border border-red-400 rounded-md hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ====== MOBILE (até md) — cards empilhados ====== */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="p-4 text-center border text-slate-400 rounded-xl border-border bg-card">
            Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center border text-slate-400 rounded-xl border-border bg-card">
            Nenhum produto encontrado.
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="p-4 border rounded-xl border-border bg-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">
                    ID {p.id} • SKU <span className="font-mono">{p.sku}</span>
                  </div>
                  <div className="font-semibold">{p.nome}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Peso: {p.peso ?? "—"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAdding(false);
                      setEditing(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md border-border hover:bg-secondary"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-400 border border-red-400 rounded-md hover:bg-red-400/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </div>

              {/* Pares A, B, C */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 border rounded-md border-emerald-600/30">
                  <div className="text-[11px] text-emerald-300">À vista A</div>
                  <div className="text-sm font-medium">{money(p.preco_venda_A)}</div>
                </div>
                <div className="p-2 border rounded-md border-emerald-600/20">
                  <div className="text-[11px] text-emerald-300/80">Prazo A</div>
                  <div className="text-sm font-medium">
                    {money(p.preco_venda_A_prazo)}
                  </div>
                </div>

                <div className="p-2 border rounded-md border-emerald-600/30">
                  <div className="text-[11px]">À vista B</div>
                  <div className="text-sm font-medium">{money(p.preco_venda_B)}</div>
                </div>
                <div className="p-2 border rounded-md border-emerald-600/20">
                  <div className="text-[11px]">Prazo B</div>
                  <div className="text-sm font-medium">
                    {money(p.preco_venda_B_prazo)}
                  </div>
                </div>

                <div className="p-2 border rounded-md border-amber-500/30">
                  <div className="text-[11px] text-amber-300">À vista C</div>
                  <div className="text-sm font-medium">{money(p.preco_venda_C)}</div>
                </div>
                <div className="p-2 border rounded-md border-amber-500/20">
                  <div className="text-[11px] text-amber-300/80">Prazo C</div>
                  <div className="text-sm font-medium">
                    {money(p.preco_venda_C_prazo)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 border rounded-md border-sky-400/30">
                  <div className="text-[11px] text-sky-300">Custo</div>
                  <div className="text-sm font-medium">{money(p.custo)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Dica: use vírgula ou ponto nos campos numéricos; valores em branco são
        tratados como <em>null</em>.
      </p>

      {/* Botão "Top" flutuante */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Voltar ao topo"
        className="fixed z-40 inline-flex items-center justify-center w-10 h-10 border rounded-full shadow-lg bottom-6 right-6 bg-slate-800 hover:bg-slate-700 border-slate-600"
      >
        <ArrowUp className="w-5 h-5 text-slate-100" />
      </button>

      {/* ===== IMPORT MODAL ===== */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !importing && setShowImport(false)}
          />
          <div className="relative w-full p-4 border sm:max-w-3xl bg-card border-border rounded-t-2xl sm:rounded-xl sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Importar produtos (JSON)</h2>
              </div>
              <button
                disabled={importing}
                onClick={() => setShowImport(false)}
                className="inline-flex items-center gap-2 px-2 py-1 text-sm border rounded-md border-border hover:bg-secondary disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Cole um <b>array JSON</b> de produtos ou um objeto no formato{" "}
                <code>{`{ "items": [ ... ] }`}</code>. Campos mínimos:{" "}
                <code>sku</code> e <code>nome</code>. O campo <code>id</code>{" "}
                (se vier) será ignorado para o servidor gerar automaticamente.
              </p>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='Ex.: [{"sku":"123","nome":"Produto","custo":10.5,"preco_venda_A":20}]'
                className="w-full min-h-[180px] rounded-md border border-input bg-background p-3 font-mono text-sm"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-400">
                  Dica: para lotes grandes, mantenha esta janela aberta e evite
                  alternar de aba, para não interromper.
                </div>
                <button
                  disabled={importing || !jsonText.trim()}
                  onClick={startImport}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importando…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Iniciar importação
                    </>
                  )}
                </button>
              </div>

              {(progress.total > 0 || logs.length > 0) && (
                <div className="space-y-2">
                  {progress.total > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Sucesso: {progress.ok}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Falhas: {progress.fail}</span>
                      </div>
                      <div className="text-slate-400">
                        Progresso: {progress.done}/{progress.total}
                      </div>
                    </div>
                  )}

                  <div className="h-40 p-2 overflow-auto font-mono text-xs border rounded-md border-border bg-background">
                    {logs.length === 0 ? (
                      <div className="text-slate-500">Sem logs ainda…</div>
                    ) : (
                      logs.map((l, i) => <div key={i}>{l}</div>)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
