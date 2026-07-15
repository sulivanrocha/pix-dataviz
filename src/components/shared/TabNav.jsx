// src/components/shared/TabNav.jsx
// Navegação principal. Usa <NavLink> (react-router) em vez de <button>:
// rastreadores de busca só descobrem páginas seguindo <a href>, então esta
// é a peça que permite ao Google encontrar as outras quatro rotas.

import { NavLink } from "react-router-dom";
import { TABS } from "../../lib/tabs";
import { trackTabView } from "../../lib/analytics";

export function TabNav() {
  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.path}
          end={tab.path === "/"}
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => trackTabView(tab.key)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}