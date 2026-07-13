import { useEffect, useMemo, useRef, useState } from "react";

const REGIOES = [
  { value: "NORTE", label: "Norte" },
  { value: "NORDESTE", label: "Nordeste" },
  { value: "CENTRO-OESTE", label: "Centro-Oeste" },
  { value: "SUDESTE", label: "Sudeste" },
  { value: "SUL", label: "Sul" },
];

// Seletor em cascata Região → Estado → Município. Sempre identifica o
// município selecionado por Municipio_Ibge (nunca por nome, que pode se
// repetir entre estados). Ao escolher um estado, busca a série mensal
// municipal em public/data/municipios/{estadoIbge}.json e repassa via
// onChange para quem for renderizar os dados (ex.: filtrar por Municipio_Ibge).
export function MunicipioSelector({ onChange = () => {} }) {
  const [index, setIndex] = useState([]);
  const [indexStatus, setIndexStatus] = useState("loading");

  const [regiao, setRegiao] = useState("");
  const [estadoIbge, setEstadoIbge] = useState("");
  const [municipioIbge, setMunicipioIbge] = useState("");
  const [query, setQuery] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [estadoData, setEstadoData] = useState({ status: "idle", dados: [] });

  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/municipios-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Falha ao carregar municipios-index.json: HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setIndex(json.municipios);
        setIndexStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setIndexStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const estados = useMemo(() => {
    if (!regiao) return [];
    const map = new Map();
    for (const m of index) {
      if (m.regiao === regiao && !map.has(m.estadoIbge)) {
        map.set(m.estadoIbge, { estadoIbge: m.estadoIbge, nome: m.estado, uf: m.uf });
      }
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [index, regiao]);

  const municipiosDoEstado = useMemo(() => {
    if (!estadoIbge) return [];
    return index.filter((m) => m.estadoIbge === estadoIbge).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [index, estadoIbge]);

  const municipiosFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return municipiosDoEstado;
    return municipiosDoEstado.filter((m) => m.nome.toLowerCase().includes(q));
  }, [municipiosDoEstado, query]);

  function notify({ nextEstadoIbge = estadoIbge, nextMunicipio = null, nextEstadoData = estadoData }) {
    onChange({
      regiao,
      estadoIbge: nextEstadoIbge || null,
      municipio: nextMunicipio,
      dadosEstado: nextEstadoData.dados,
      loadingEstado: nextEstadoData.status === "loading",
    });
  }

  function handleRegiaoChange(novaRegiao) {
    setRegiao(novaRegiao);
    setEstadoIbge("");
    setMunicipioIbge("");
    setQuery("");
    setEstadoData({ status: "idle", dados: [] });
    onChange({ regiao: novaRegiao, estadoIbge: null, municipio: null, dadosEstado: [], loadingEstado: false });
  }

  function handleEstadoChange(valor) {
    const novoEstadoIbge = valor ? Number(valor) : "";
    setEstadoIbge(novoEstadoIbge);
    setMunicipioIbge("");
    setQuery("");

    const requestId = ++requestIdRef.current;

    if (!novoEstadoIbge) {
      setEstadoData({ status: "idle", dados: [] });
      notify({ nextEstadoIbge: "", nextEstadoData: { status: "idle", dados: [] } });
      return;
    }

    setEstadoData({ status: "loading", dados: [] });
    notify({ nextEstadoIbge: novoEstadoIbge, nextEstadoData: { status: "loading", dados: [] } });

    fetch(`/data/municipios/${novoEstadoIbge}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Falha ao carregar município do estado ${novoEstadoIbge}: HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (requestIdRef.current !== requestId) return;
        const next = { status: "ready", dados: json.dados };
        setEstadoData(next);
        notify({ nextEstadoIbge: novoEstadoIbge, nextEstadoData: next });
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        const next = { status: "error", dados: [] };
        setEstadoData(next);
        notify({ nextEstadoIbge: novoEstadoIbge, nextEstadoData: next });
      });
  }

  function handleMunicipioSelect(municipio) {
    setMunicipioIbge(municipio.ibge);
    setQuery(`${municipio.nome}, ${municipio.uf}`);
    setComboOpen(false);
    notify({ nextMunicipio: municipio });
  }

  const indexPronto = indexStatus === "ready";

  return (
    <div className="filters-row municipio-selector">
      <label>
        Região
        <select
          value={regiao}
          onChange={(e) => handleRegiaoChange(e.target.value)}
          disabled={!indexPronto}
        >
          <option value="" disabled>
            Selecione a região
          </option>
          {REGIOES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Estado
        <select
          value={estadoIbge}
          onChange={(e) => handleEstadoChange(e.target.value)}
          disabled={!regiao}
        >
          <option value="" disabled>
            Selecione o estado
          </option>
          {estados.map((e) => (
            <option key={e.estadoIbge} value={e.estadoIbge}>
              {e.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="municipio-combobox">
        Município
        <input
          type="text"
          value={query}
          placeholder="Buscar município..."
          disabled={!estadoIbge}
          onChange={(e) => {
            setQuery(e.target.value);
            setMunicipioIbge("");
            setComboOpen(true);
          }}
          onFocus={() => setComboOpen(true)}
          onBlur={() => setComboOpen(false)}
        />
        {comboOpen && municipiosFiltrados.length > 0 && (
          <ul className="municipio-combobox-list">
            {municipiosFiltrados.map((m) => (
              <li key={m.ibge}>
                <button
                  type="button"
                  aria-selected={m.ibge === municipioIbge}
                  className={m.ibge === municipioIbge ? "selected" : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMunicipioSelect(m);
                  }}
                >
                  {m.nome}, {m.uf}
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>

      {estadoData.status === "loading" && <span className="filters-hint">Carregando dados do estado...</span>}
      {estadoData.status === "error" && <span className="filters-hint">Falha ao carregar dados do estado.</span>}
      {indexStatus === "error" && <span className="filters-hint">Falha ao carregar lista de municípios.</span>}
    </div>
  );
}
