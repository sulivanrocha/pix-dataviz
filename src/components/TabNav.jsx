import { TABS } from "../lib/tabs";

export function TabNav({ active, onChange }) {
  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={tab.key === active ? "active" : ""}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
