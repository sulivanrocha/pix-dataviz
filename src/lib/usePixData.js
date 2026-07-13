import { useEffect, useState } from "react";

const FILES = {
  usuariosDict: "/data/usuarios_dict.json",
  transacoes: "/data/transacoes.json",
  municipio: "/data/municipio.json",
  chaves: "/data/chaves.json",
};

// Carrega os snapshots estáticos gerados por scripts/fetch-data.mjs.
export function usePixData() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      Object.entries(FILES).map(([key, url]) =>
        fetch(url).then((res) => {
          if (!res.ok) throw new Error(`Falha ao carregar ${url}: HTTP ${res.status}`);
          return res.json().then((json) => [key, json]);
        })
      )
    )
      .then((entries) => {
        if (cancelled) return;
        setState({ status: "ready", data: Object.fromEntries(entries), error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ status: "error", data: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
