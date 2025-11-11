// App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "./hooks/useTheme";
import { LoadingProvider, useLoading } from "./hooks/useLoading";
import LoadingOverlay from "./components/LoadingOverlay";
import RouteChangeLoader from "./components/RouteChangeLoader";

import Header from "./components/Header";
import Home from "./pages/Home";
import MarginSimulator from "./pages/MarginSimulator";
import ProductsManagement from "./pages/ProductsManager";
import Login from "./components/Login";

/* ============== API helper ============== */
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://server-simulador-de-vendas-v3.onrender.com";

async function api(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path}`;
  return fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
}

/* ============== App Shell ============== */
const AppContent: React.FC = () => {
  const { show, hide } = useLoading();
  const [isLogged, setIsLogged] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        show("Checando sessão...");
        const r = await api("/api/me");
        setIsLogged(r.ok);
      } catch {
        setIsLogged(false);
      } finally {
        hide();
      }
    })();
  }, [show, hide]);

  if (isLogged === null) return <div className="min-h-screen bg-background" />;
  if (!isLogged)
    return (
      <Login
        onLogin={() => setIsLogged(true)}
        api={api}
        logoSrc="/logo.svg" // troque se precisar
        title="Dashboard Sulpet"
      />
    );

  const doLogout = async () => {
    try {
      show("Saindo...");
      await api("/api/logout", { method: "POST" });
    } finally {
      hide();
      location.reload();
    }
  };

  return (
    <BrowserRouter>
      <RouteChangeLoader />
      <Header onLogout={doLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulador" element={<MarginSimulator />} />
        <Route path="/produtos" element={<ProductsManagement />} />
      </Routes>
    </BrowserRouter>
  );
};

/* ============== App Root ============== */
const App: React.FC = () => (
  <ThemeProvider>
    <LoadingProvider>
      <LoadingOverlay />
      <AppContent />
    </LoadingProvider>
  </ThemeProvider>
);

export default App;
