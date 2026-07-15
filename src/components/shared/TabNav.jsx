import { TABS } from "../../lib/tabs";
import { trackTabView } from "../../lib/analytics";

export function TabNav({ active, onChange }) {
  const handleClick = (key) => {
    trackTabView(key);
    onChange(key);
  };

  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={tab.key === active ? "active" : ""}
          onClick={() => handleClick(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}