import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <div className="container py-8 mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Ferramentas</h1>
        <p className="text-muted-foreground">Escolha uma ferramenta abaixo.</p>
      </header>

      {/* Só os cards (sem “Central de Relatórios”) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/simulador"
          className="p-5 transition border shadow group rounded-xl border-border bg-card hover:shadow-md hover:border-accent-foreground"
        >
          <div className="mb-2 text-sm text-muted-foreground">Vendas</div>
          <h3 className="mb-1 text-lg font-semibold transition-colors group-hover:text-primary">
            Simulador de Margem
          </h3>
          <p className="text-sm text-muted-foreground">
            Calcule margem por preço A/B/C/D, com bonificação unitária e em R$.
          </p>
        </Link>

        <div className="p-5 border border-dashed rounded-xl border-border opacity-70">
          <div className="mb-2 text-sm text-muted-foreground">Em breve</div>
          <h3 className="mb-1 text-lg font-semibold">Nova ferramenta</h3>
          <p className="text-sm text-muted-foreground">Em construção…</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
