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
} from "lucide-react";

// Mesmo helper do seu App.tsx (mantém cookies e CORS)
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://server-simulador-de-vendas-v3.onrender.com";

async function api(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(t || `HTTP ${r.status}`);
  }
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
  bonificacao_unitaria: number | null;
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

  const bind = (key: keyof Draft) => ({
    value:
      typeof form[key] === "number" || form[key] === null
        ? String(form[key] ?? "")
        : (form[key] as any),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (
        [
          "peso",
          "preco_venda_A",
          "preco_venda_B",
          "preco_venda_C",
          "preco_venda_A_prazo",
          "preco_venda_B_prazo",
          "preco_venda_C_prazo",
          "custo",
          "bonificacao_unitaria",
        ].includes(key as string)
      ) {
        setForm((f) => ({ ...f, [key]: toNumber(v) }));
      } else {
        setForm((f) => ({ ...f, [key]: v }));
      }
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = JSON.stringify(form);
      if (isEdit) {
        const r = await api(`/api/products/${initial!.id}`, {
          method: "PUT",
          body,
        });
        onSaved(await r.json());
      } else {
        const r = await api(`/api/products`, { method: "POST", body });
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

  const load = async () => {
    try {
      setLoading(true);
      const r = await api("/api/products");
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
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      setItems((list) => list.filter((x) => x.id !== p.id));
    } catch (err) {
      alert("Erro ao excluir: " + (err as Error).message);
    }
  };

  const EXPORT_CSV = `${API_BASE}/api/products/export.csv`;
  const EXPORT_HTML = `${API_BASE}/api/products/export.html`;

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>

        <div className="flex items-center gap-2">
          <a
            href={EXPORT_CSV}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md border-border hover:bg-secondary"
          >
            <Download className="w-4 h-4" />
            CSV
          </a>
          <a
            href={EXPORT_HTML}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md border-border hover:bg-secondary"
          >
            <FileText className="w-4 h-4" />
            HTML / Imprimir
          </a>
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

      {/* Tabela */}
      <div className="overflow-hidden border rounded-xl border-border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-background/40">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th className="w-[70px]">ID</th>
                <th className="w-[110px]">SKU</th>
                <th>Produto</th>
                <th className="w-[90px]">Peso</th>

                <th className="text-center w-[120px] text-emerald-300">À vista A</th>
                <th className="text-center w-[120px] text-emerald-300">À vista B</th>
                <th className="text-center w-[120px] text-emerald-300">À vista C</th>

                <th className="text-center w-[120px] text-emerald-300/80">Prazo A</th>
                <th className="text-center w-[120px] text-emerald-300/80">Prazo B</th>
                <th className="text-center w-[120px] text-emerald-300/80">Prazo C</th>

                <th className="text-right w-[120px] text-sky-300">Custo</th>
                <th className="text-right w-[120px]">Bonif.</th>
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

                    <td className="px-3 py-2 text-center">{money(p.preco_venda_A)}</td>
                    <td className="px-3 py-2 text-center">{money(p.preco_venda_B)}</td>
                    <td className="px-3 py-2 text-center">{money(p.preco_venda_C)}</td>

                    <td className="px-3 py-2 text-center">{money(p.preco_venda_A_prazo)}</td>
                    <td className="px-3 py-2 text-center">{money(p.preco_venda_B_prazo)}</td>
                    <td className="px-3 py-2 text-center">{money(p.preco_venda_C_prazo)}</td>

                    <td className="px-3 py-2 text-right text-sky-300">
                      {money(p.custo)}
                    </td>
                    <td className="px-3 py-2 text-right">{money(p.bonificacao_unitaria)}</td>

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

      <p className="mt-3 text-xs text-slate-500">
        Dica: use vírgula ou ponto nos campos numéricos; valores em branco são tratados
        como <em>null</em>.
      </p>
    </div>
  );
};

export default ProductsManagement;
