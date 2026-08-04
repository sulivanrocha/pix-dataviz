import { exportCsv } from "../../lib/exportCsv";
import { useI18n } from "../../lib/i18n/I18nContext";

export function CsvDownloadButton({
  data,
  filename,
  label,
}) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("common.csvDownload");
  const disabled = !Array.isArray(data) || data.length === 0;

  return (
    <button
      type="button"
      className="csv-download-button"
      disabled={disabled}
      onClick={() => exportCsv(filename, data)}
      aria-label={resolvedLabel}
    >
      <span aria-hidden="true">↓</span>
      <span>{resolvedLabel}</span>

      <style>
        {`
          .csv-download-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 34px;
            padding: 7px 11px;
            border: 1px solid var(--baseline);
            border-radius: 6px;
            background: transparent;
            color: var(--text-secondary);
            font: inherit;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
            transition:
              background-color 150ms ease,
              color 150ms ease,
              border-color 150ms ease;
          }

          .csv-download-button:hover:not(:disabled) {
            background: var(--gridline);
            color: var(--text-primary);
          }

          .csv-download-button:focus-visible {
            outline: 2px solid var(--series-1);
            outline-offset: 2px;
          }

          .csv-download-button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }
        `}
      </style>
    </button>
  );
}