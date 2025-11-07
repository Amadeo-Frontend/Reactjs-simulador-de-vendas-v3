import React from "react";
import Loader from "react-loaders";
import "loaders.css/loaders.css"; // garantia (se já importar no index.tsx, pode remover daqui)
import { useLoading } from "../hooks/useLoading";

const LoadingOverlay: React.FC = () => {
  const { isLoading, label } = useLoading();
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/50">
      <Loader type="ball-spin-fade-loader" active />
    </div>
  );
};

export default LoadingOverlay;
