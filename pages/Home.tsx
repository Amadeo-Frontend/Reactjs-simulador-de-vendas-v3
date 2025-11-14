import React from "react";
import { Link } from "react-router-dom";
import { Calculator, PackageSearch, ReceiptText, Rocket } from "lucide-react";

const Home: React.FC = () => {
  const card =
    "group rounded-xl border border-border bg-card p-5 shadow transition hover:border-accent-foreground hover:shadow-md";

  const titleRow =
    "mb-1 flex items-center gap-2 text-lg font-semibold transition-colors group-hover:text-primary";

  const iconCls = "h-5 w-5 text-indigo-400";

  return (
    <div className="container py-8 mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Ferramentas</h1>
        <p className="text-muted-foreground">Escolha uma ferramenta abaixo.</p>
      </header>
      {/* Simulador */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/simulador" className={card}>
          <div className="mb-2 text-sm text-muted-foreground">Vendas</div>
          <div className={titleRow}>
            <Calculator className={iconCls} />
            <span>Simulador de Margem</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Calcule margem por faixa (A/B/C), com bonificação unitária e em R$.
          </p>
        </Link>

        {/* Produtos */}
        <Link to="/produtos" className={card}>
          <div className="mb-2 text-sm text-muted-foreground">
            Gerenciar Produtos
          </div>
          <div className={titleRow}>
            <PackageSearch className={iconCls} />
            <span>Todos os Produtos</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Inserir, editar, excluir e exportar.
          </p>
        </Link>

        {/* Vendas */}
        <Link to="/vendas" className={card}>
          <div className="mb-2 text-sm text-muted-foreground">
            Gerenciar Vendas
          </div>
          <div className={titleRow}>
            <ReceiptText className={iconCls} />
            <span>Todas as Vendas</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Listagem das vendas criadas no simulador.
          </p>
        </Link>

        {/* Em breve */}
        <div className="p-5 border border-dashed rounded-xl border-border opacity-80">
          <div className="mb-2 text-sm text-muted-foreground">Em breve</div>
          <div className={titleRow}>
            <Rocket className={iconCls} />
            <span>Nova ferramenta</span>
          </div>
          <p className="text-sm text-muted-foreground">Em construção…</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
