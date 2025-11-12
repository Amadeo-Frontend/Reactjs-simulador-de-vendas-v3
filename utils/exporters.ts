// utils/exporters.ts
import { Product } from "../types";

function esc(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Escapa ; " e quebras de linha
  const needsQuotes = /[;"\n\r]/.test(s);
  const s2 = s.replace(/"/g, '""');
  return needsQuotes ? `"${s2}"` : s2;
}

// CSV (separador ; funciona bem no Excel PT-BR)
export function productsToCSV(rows: Product[]): string {
  const headers = [
    "id","sku","nome","peso",
    "preco_venda_A","preco_venda_A_prazo",
    "preco_venda_B","preco_venda_B_prazo",
    "preco_venda_C","preco_venda_C_prazo",
    "custo","bonificacao_unitaria"
  ];
  const lines = [
    headers.join(";"),
    ...rows.map(r => [
      r.id, r.sku, r.nome, r.peso,
      r.preco_venda_A, r.preco_venda_A_prazo,
      r.preco_venda_B, r.preco_venda_B_prazo,
      r.preco_venda_C, r.preco_venda_C_prazo,
      r.custo, r.bonificacao_unitaria
    ].map(esc).join(";"))
  ];
  return lines.join("\r\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Gera HTML imprimível (independe do Tailwind)
export function openPrintableHTML(rows: Product[]) {
  const head = `
  <meta charset="utf-8">
  <title>Produtos</title>
  <style>
    *{box-sizing:border-box;font-family:Inter,system-ui,Arial}
    body{margin:24px;background:#fff;color:#0f172a}
    h1{margin:0 0 12px;font-size:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
    th{background:#f8fafc;position:sticky;top:0}
    tfoot td{font-weight:600;background:#f1f5f9}
    @media print{
      body{margin:0}
      .no-print{display:none}
      th{background:#eee !important;-webkit-print-color-adjust:exact}
    }
  </style>`;
  const headers = [
    "ID","SKU","Nome","Peso",
    "PV A","Prazo A",
    "PV B","Prazo B",
    "PV C","Prazo C",
    "Custo","Bonif."
  ];
  const bodyRows = rows.map(r=>`
    <tr>
      <td>${esc(r.id)}</td>
      <td>${esc(r.sku)}</td>
      <td>${esc(r.nome)}</td>
      <td>${esc(r.peso)}</td>
      <td>${esc(r.preco_venda_A)}</td>
      <td>${esc(r.preco_venda_A_prazo)}</td>
      <td>${esc(r.preco_venda_B)}</td>
      <td>${esc(r.preco_venda_B_prazo)}</td>
      <td>${esc(r.preco_venda_C)}</td>
      <td>${esc(r.preco_venda_C_prazo)}</td>
      <td>${esc(r.custo)}</td>
      <td>${esc(r.bonificacao_unitaria)}</td>
    </tr>`).join("");

  const html = `
  <html><head>${head}</head>
  <body>
    <div class="no-print" style="margin-bottom:12px">
      <button onclick="window.print()" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#0ea5e9;color:#fff;cursor:pointer">Imprimir</button>
    </div>
    <h1>Lista de Produtos</h1>
    <table>
      <thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${bodyRows}</tbody>
      <tfoot><tr><td colspan="12">Total de itens</td><td>${rows.length}</td></tr></tfoot>
    </table>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) { alert("Pop-up bloqueado. Permita abrir nova aba para imprimir."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
