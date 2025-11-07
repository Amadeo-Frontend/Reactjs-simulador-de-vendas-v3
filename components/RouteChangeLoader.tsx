import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLoading } from "../hooks/useLoading";

/** Mostra um loader curto em toda troca de rota */
const RouteChangeLoader: React.FC = () => {
  const { pathname } = useLocation();
  const { show, hide } = useLoading();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    // evita “flash”: exibe por no mínimo 300ms
    show("Carregando...");
    timer.current = window.setTimeout(() => hide(), 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
};

export default RouteChangeLoader;
