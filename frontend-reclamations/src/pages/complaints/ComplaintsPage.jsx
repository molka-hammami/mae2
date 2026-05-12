import { useContext, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiFilter, FiRefreshCw, FiSearch } from "react-icons/fi";
import { DateRange } from "react-date-range";
import ComplaintTable from "../../components/complaints/ComplaintTable";
import SkeletonLoader from "../../components/common/SkeletonLoader";
import { fetchComplaints } from "../../api/complaintsApi";
import { ThemeContext } from "../../context/ThemeContext";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const defaultFilters = {
  client: "",
  agency: "",
  channel: "Tous",
  startDate: "",
  endDate: "",
  keyword: "",
};

const sortOptions = [
  { value: "date_desc", label: "Date récente" },
  { value: "date_asc", label: "Date ancienne" },
  { value: "status", label: "Statut" },
  { value: "category", label: "Catégorie" },
  { value: "urgency", label: "Urgence" },
];

function ComplaintsPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState("date_desc");
  const [keywordFocused, setKeywordFocused] = useState(false);
  const [showPeriodCalendar, setShowPeriodCalendar] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const itemsPerPage = 16;

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const data = await fetchComplaints();
        setComplaints(data);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement des réclamations");
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, []);

  useEffect(() => {
    const closePeriodOnOutsideClick = (event) => {
      if (event.target.closest("[data-complaints-period-filter='true']")) {
        return;
      }

      setShowPeriodCalendar(false);
    };

    document.addEventListener("mousedown", closePeriodOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closePeriodOnOutsideClick);
    };
  }, []);

  const channelOptions = useMemo(() => {
    const channels = complaints.map((item) => item.source).filter(Boolean);
    return ["Tous", ...Array.from(new Set(channels))];
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const keyword = normalize(filters.keyword);
    const client = normalize(filters.client);
    const agency = normalize(filters.agency);

    return complaints.filter((item) => {
      if (client && !normalize(item.author_name).includes(client)) return false;
      if (agency && !normalize(item.assigned_agent).includes(agency)) return false;
      if (filters.channel !== "Tous" && item.source !== filters.channel) return false;

      const complaintDate = parseDate(item.comment_date || item.created_at || item.opened_at);
      if (filters.startDate) {
        const start = new Date(`${filters.startDate}T00:00:00`);
        if (!complaintDate || complaintDate < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(`${filters.endDate}T23:59:59`);
        if (!complaintDate || complaintDate > end) return false;
      }

      if (keyword) {
        const searchable = normalize(
          [
            item.text_original,
            item.category,
            item.status,
            item.urgency,
            item.source,
            item.author_name,
            item.assigned_agent,
            item.internal_note,
          ].join(" ")
        );
        if (!searchable.includes(keyword)) return false;
      }

      return true;
    });
  }, [complaints, filters]);

  const sortedComplaints = useMemo(() => {
    const statusOrder = { EN_ATTENTE: 1, EN_COURS: 2, TRAITEE: 3, "TRAITÉE": 3 };
    const urgencyOrder = { elevee: 1, moyenne: 2, faible: 3 };

    return [...filteredComplaints].sort((a, b) => {
      if (sortBy === "status") {
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      }
      if (sortBy === "category") {
        return String(a.category || "NON CLASSÉE").localeCompare(String(b.category || "NON CLASSÉE"));
      }
      if (sortBy === "urgency") {
        return (urgencyOrder[a.urgency] || 99) - (urgencyOrder[b.urgency] || 99);
      }

      const dateA = parseDate(a.comment_date || a.created_at || a.opened_at)?.getTime() || 0;
      const dateB = parseDate(b.comment_date || b.created_at || b.opened_at)?.getTime() || 0;
      return sortBy === "date_asc" ? dateA - dateB : dateB - dateA;
    });
  }, [filteredComplaints, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedComplaints.length / itemsPerPage));

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "channel") return value !== "Tous";
      return Boolean(value);
    }).length;
  }, [filters]);

  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedComplaints.slice(start, start + itemsPerPage);
  }, [sortedComplaints, currentPage]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSortBy("date_desc");
    setShowPeriodCalendar(false);
    setRange([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
  };

  if (loading) {
    return <SkeletonLoader type="table" rows={9} />;
  }

  if (error) {
    return <p style={styles.error}>{error}</p>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerBlock}>
        <h1 style={{ ...styles.title, ...(isDark ? styles.darkTitle : {}) }}>
          Liste des Réclamations
        </h1>
        <p style={{ ...styles.subtitle, ...(isDark ? styles.darkMutedText : {}) }}>
          Consultez, filtrez et priorisez les réclamations détectées.
        </p>
      </div>

      <div style={{ ...styles.card, ...(isDark ? styles.darkCard : {}) }}>
        <div style={{ ...styles.filterPanel, ...(isDark ? styles.darkFilterPanel : {}) }}>
          <div style={styles.filtersHeader}>
            <div style={styles.filtersTitle}>
              <span style={styles.filterIconBox}>
                <FiFilter />
              </span>
              <span>Recherche avancée</span>
              {activeFiltersCount > 0 && (
                <span style={styles.activeFilterBadge}>{activeFiltersCount}</span>
              )}
            </div>
            <button
              type="button"
              onClick={resetFilters}
              style={{ ...styles.resetButton, ...(isDark ? styles.darkControl : {}) }}
            >
              <FiRefreshCw />
              Réinitialiser
            </button>
          </div>

          <div style={styles.filtersGrid}>
            <FilterInput label="Client" value={filters.client} onChange={(value) => updateFilter("client", value)} placeholder="Nom du client" isDark={isDark} />
            <FilterInput label="Agence" value={filters.agency} onChange={(value) => updateFilter("agency", value)} placeholder="Agent ou agence" isDark={isDark} />
            <FilterSelect label="Canal" value={filters.channel} onChange={(value) => updateFilter("channel", value)} options={channelOptions} isDark={isDark} />
            <PeriodFilter
              startDate={filters.startDate}
              endDate={filters.endDate}
              range={range}
              showCalendar={showPeriodCalendar}
              onToggle={() => setShowPeriodCalendar((prev) => !prev)}
              onChange={(selection) => {
                setRange([selection]);
                updateFilter("startDate", selection.startDate.toISOString().split("T")[0]);
                updateFilter("endDate", selection.endDate.toISOString().split("T")[0]);
              }}
              onApply={() => setShowPeriodCalendar(false)}
              isDark={isDark}
            />
            <label style={styles.fieldWide}>
              <span style={{ ...styles.label, ...(isDark ? styles.darkMutedText : {}) }}>Mot-clé</span>
              <div
                style={{
                  ...styles.searchBox,
                  ...(keywordFocused ? styles.inputFocused : {}),
                  ...(isDark ? styles.darkControl : {}),
                }}
              >
                <FiSearch />
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(event) => updateFilter("keyword", event.target.value)}
                  onFocus={() => setKeywordFocused(true)}
                  onBlur={() => setKeywordFocused(false)}
                  placeholder="Texte, catégorie, statut..."
                  style={{ ...styles.searchInput, ...(isDark ? styles.darkInputText : {}) }}
                />
              </div>
            </label>
          </div>
        </div>

        <div style={styles.topBar}>
          <div style={{ ...styles.countBlock, ...(isDark ? styles.darkMutedText : {}) }}>
            Résultats :{" "}
            <span style={{ ...styles.countValue, ...(isDark ? styles.darkText : {}) }}>
              {sortedComplaints.length}
            </span>
            <span style={styles.totalMuted}> / {complaints.length}</span>
          </div>

          <div style={styles.actionsRight}>
            <FilterSelect
              label="Tri"
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              optionValue="value"
              optionLabel="label"
              isDark={isDark}
              compact
            />
            <div style={styles.paginationBlock}>
              <span style={{ ...styles.pageText, ...(isDark ? styles.darkMutedText : {}) }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={styles.paginationButtons}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.pageButton,
                    ...(isDark ? styles.pageButtonDark : {}),
                    ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
                  }}
                  aria-label="Page précédente"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.pageButton,
                    ...(isDark ? styles.pageButtonDark : {}),
                    ...(currentPage === totalPages ? styles.pageButtonDisabled : {}),
                  }}
                  aria-label="Page suivante"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        <ComplaintTable data={paginatedComplaints} />
      </div>
    </div>
  );
}

function PeriodFilter({
  startDate,
  endDate,
  range,
  showCalendar,
  onToggle,
  onChange,
  onApply,
  isDark,
}) {
  const label = startDate && endDate ? `${startDate} - ${endDate}` : "Choisir une période";

  return (
    <label data-complaints-period-filter="true" style={{ ...styles.field, ...styles.periodField }}>
      <span style={{ ...styles.label, ...(isDark ? styles.darkMutedText : {}) }}>Période</span>
      <button
        type="button"
        onClick={onToggle}
        style={{
          ...styles.periodButton,
          ...(showCalendar ? styles.inputFocused : {}),
          ...(isDark ? styles.darkControl : {}),
        }}
      >
        <span>{label}</span>
        <FiCalendar />
      </button>

      {showCalendar && (
        <div style={{ ...styles.periodDropdown, ...(isDark ? styles.darkDropdown : {}) }}>
          <div style={{ ...styles.periodCalendarWrap, ...(isDark ? styles.darkCalendarWrap : {}) }}>
            <DateRange
              editableDateInputs
              onChange={(item) => onChange(item.selection)}
              moveRangeOnFirstSelection={false}
              ranges={range}
              showMonthAndYearPickers={false}
            />
          </div>
          <button type="button" onClick={onApply} style={styles.periodApplyButton}>
            Appliquer
          </button>
        </div>
      )}
    </label>
  );
}

function FilterInput({ label, value, onChange, placeholder = "", type = "text", isDark }) {
  const [focused, setFocused] = useState(false);

  return (
    <label style={styles.field}>
      <span style={{ ...styles.label, ...(isDark ? styles.darkMutedText : {}) }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          ...styles.input,
          ...(focused ? styles.inputFocused : {}),
          ...(isDark ? styles.darkControl : {}),
          ...(isDark ? styles.darkInputText : {}),
        }}
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  optionValue,
  optionLabel,
  isDark,
  compact = false,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <label style={compact ? styles.fieldCompact : styles.field}>
      <span style={{ ...styles.label, ...(isDark ? styles.darkMutedText : {}) }}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...styles.input,
          ...styles.selectInput,
          ...(focused ? styles.inputFocused : {}),
          ...(isDark ? styles.darkControl : {}),
          ...(isDark ? styles.darkInputText : {}),
        }}
      >
        {options.map((option) => {
          const currentValue = optionValue ? option[optionValue] : option;
          const currentLabel = optionLabel ? option[optionLabel] : option;
          return (
            <option key={currentValue} value={currentValue}>
              {currentLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const parts = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!parts) return null;
  const [, day, month, year] = parts;
  const fallback = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  headerBlock: {
    marginBottom: "0",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
    color: "#1e293b",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#64748b",
    fontSize: "15px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.07)",
    border: "1px solid rgba(15, 23, 42, 0.06)",
    overflow: "visible",
  },
  filterPanel: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9)",
  },
  filtersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  filtersTitle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#14532d",
    fontWeight: "900",
    fontSize: "16px",
  },
  filterIconBox: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#eefdf3",
    color: "#166534",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilterBadge: {
    minWidth: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "#166534",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 7px",
    fontSize: "12px",
    fontWeight: "900",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    columnGap: "12px",
    rowGap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },
  periodField: {
    position: "relative",
    zIndex: 20,
  },
  fieldWide: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
    gridColumn: "span 2",
  },
  fieldCompact: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "170px",
  },
  label: {
    color: "#475569",
    fontSize: "11px",
    fontWeight: "800",
    paddingLeft: "2px",
    textTransform: "uppercase",
  },
  input: {
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #d9e2ec",
    background: "#ffffff",
    padding: "0 12px",
    color: "#0f172a",
    fontWeight: "600",
    outline: "none",
    boxShadow: "0 1px 0 rgba(15, 23, 42, 0.03)",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
  },
  selectInput: {
    cursor: "pointer",
  },
  inputFocused: {
    border: "1px solid #3f8d69",
    boxShadow: "0 0 0 3px rgba(63, 141, 105, 0.12)",
  },
  periodButton: {
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #d9e2ec",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 12px",
    fontWeight: "700",
    outline: "none",
    boxShadow: "0 1px 0 rgba(15, 23, 42, 0.03)",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    width: "100%",
    textAlign: "left",
  },
  periodDropdown: {
    position: "absolute",
    top: "70px",
    left: 0,
    zIndex: 60,
    width: "390px",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "12px",
    boxShadow: "0 24px 55px rgba(15, 23, 42, 0.18)",
  },
  periodCalendarWrap: {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "14px",
    overflow: "hidden",
  },
  periodApplyButton: {
    width: "100%",
    marginTop: "10px",
    border: "none",
    background: "linear-gradient(135deg, #166534, #3f8d69)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 14px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px",
  },
  searchBox: {
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #d9e2ec",
    background: "#ffffff",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#64748b",
    boxShadow: "0 1px 0 rgba(15, 23, 42, 0.03)",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
    fontWeight: "600",
  },
  resetButton: {
    height: "40px",
    borderRadius: "999px",
    border: "1px solid #86efac",
    background: "#ffffff",
    color: "#166534",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 14px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(22, 101, 52, 0.08)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "14px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  countBlock: {
    color: "#475569",
    fontSize: "15px",
    fontWeight: "700",
  },
  countValue: {
    color: "#1e293b",
    fontWeight: "900",
  },
  totalMuted: {
    color: "#94a3b8",
  },
  actionsRight: {
    display: "flex",
    alignItems: "flex-end",
    gap: "14px",
    flexWrap: "wrap",
  },
  paginationBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    height: "42px",
  },
  pageText: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "700",
  },
  paginationButtons: {
    display: "flex",
    gap: "8px",
  },
  pageButton: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "18px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageButtonDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  error: {
    fontSize: "16px",
    color: "#dc2626",
  },
  darkCard: {
    background: "#0f172a",
    border: "1px solid #334155",
    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
  },
  darkFilterPanel: {
    background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
    border: "1px solid #334155",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  },
  darkTitle: {
    color: "#f8fafc",
  },
  darkText: {
    color: "#f8fafc",
  },
  darkMutedText: {
    color: "#cbd5e1",
  },
  darkControl: {
    background: "#111827",
    border: "1px solid #334155",
    color: "#f8fafc",
  },
  darkDropdown: {
    background: "#111827",
    border: "1px solid #334155",
    boxShadow: "0 24px 55px rgba(0, 0, 0, 0.35)",
  },
  darkCalendarWrap: {
    background: "#111827",
  },
  darkInputText: {
    color: "#f8fafc",
  },
};

export default ComplaintsPage;
