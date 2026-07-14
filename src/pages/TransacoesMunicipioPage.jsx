return (
  <>
    <Filters
      months={months}
      start={range.start}
      end={range.end}
      onStartChange={(value) =>
        setFiltros((current) => ({ ...current, start: value }))
      }
      onEndChange={(value) =>
        setFiltros((current) => ({ ...current, end: value }))
      }
      hint="Todos os filtros abaixo afetam os cards e gráficos da página."
    >
      <label>
        Região
        <select
          value={filtros.regiao}
          onChange={(event) =>
            setFiltros((current) => ({
              ...current,
              regiao: event.target.value,
              estadoIbge: "",
              municipio: null,
              dadosEstado: [],
            }))
          }
        >
          {REGIOES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <MunicipioSelector
        regiao={filtros.regiao}
        estadoIbge={filtros.estadoIbge}
        municipio={filtros.municipio}
        onChange={(selection) =>
          setFiltros((current) => ({
            ...current,
            regiao: selection.regiao || "Todas",
            estadoIbge: selection.estadoIbge || "",
            municipio: selection.municipio || null,
            dadosEstado: selection.dadosEstado || [],
          }))
        }
      />

      <label>
        Perspectiva
        <select
          value={filtros.perspectiva}
          onChange={(event) =>
            setFiltros((current) => ({
              ...current,
              perspectiva: event.target.value,
            }))
          }
        >
          {PERSPECTIVAS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Visão
        <select
          value={filtros.visao}
          onChange={(event) =>
            setFiltros((current) => ({
              ...current,
              visao: event.target.value,
            }))
          }
        >
          {VISOES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </Filters>

    <section className="kpi-row">
      {/* Cards calculados com os mesmos filtros globais */}
    </section>

    <section className="charts-grid">
      <StateRanking
        porEstadoMensal={municipio.porEstadoMensal}
        start={range.start}
        end={range.end}
        regiao={filtros.regiao}
        estadoIbge={filtros.estadoIbge}
        perspectiva={filtros.perspectiva}
        visao={filtros.visao}
        topN={10}
        showCsvDownload
      />
    </section>

    <section className="charts-grid">
      <RegiaoSummaryChart
        porEstadoMensal={municipio.porEstadoMensal}
        start={range.start}
        end={range.end}
        regiao={filtros.regiao}
        estadoIbge={filtros.estadoIbge}
        municipio={filtros.municipio}
        serieMunicipio={serieMunicipio}
        perspectiva={filtros.perspectiva}
        visao={filtros.visao}
        ultimoMesCompleto={ultimoMesCompleto}
        showCsvDownload
      />
    </section>
  </>
);