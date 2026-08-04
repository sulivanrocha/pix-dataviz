import { useI18n } from "../../lib/i18n/I18nContext";

export function StatTile({ label, value, delta }) {
  const { t } = useI18n();

  return (
    <div className="stat-tile">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {delta != null && (
        <p className={`stat-delta${delta >= 0 ? " positive" : ""}`}>
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}% {t("common.vsPrevMonth")}
        </p>
      )}
    </div>
  );
}
