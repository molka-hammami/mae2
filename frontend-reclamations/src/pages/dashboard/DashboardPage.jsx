import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import ComplaintTable from "../../components/complaints/ComplaintTable";

import PageLoader from "../../components/common/PageLoader";
function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [allComplaints, setAllComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("toutes");
  const [channelFilter, setChannelFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [periodFilter, setPeriodFilter] = useState("30 derniers jours");
  const [searchTerm, setSearchTerm] = useState("");

  const [hoveredReset, setHoveredReset] = useState(false);
  const [hoveredChannel, setHoveredChannel] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const runWithLoader = (callback) => {
  setPageLoading(true);

  setTimeout(() => {
    callback();
    setPageLoading(false);
  }, 450);
};
  useEffect(() => {
    async function loadComplaints() {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (user?.role === "AGENT" && user?.assignedCategory) {
          params.append("role", user.role);
          params.append("assigned_category", user.assignedCategory);
        }

        const url = `http://127.0.0.1:8000/api/reclamations/${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des réclamations");
        }

        const data = await response.json();
        setComplaints(data);
        const allResponse = await fetch("http://127.0.0.1:8000/api/reclamations/");

if (allResponse.ok) {
  const allData = await allResponse.json();
  setAllComplaints(allData);
}
      } catch (err) {
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, [user?.role, user?.assignedCategory]);

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  const resetFilters = () => {
    setChannelFilter("Tous");
    setCategoryFilter("Toutes");
    setStatusFilter("Tous");
    setPeriodFilter("30 derniers jours");
    setSearchTerm("");
    setActiveTab("toutes");
    setCurrentPage(1);
  };

  const isNotClassified = (item) => {
    return (
      !item.category ||
      item.category === "" ||
      item.category === "NON CLASSÉE" ||
      item.category === "Non classée" ||
      item.category === "Non classé" ||
      item.category === "non_classée" ||
      item.category === "non_classee"
    );
  };

  const normalizeCategory = (item) => {
    return isNotClassified(item) ? "NON CLASSÉE" : item.category;
  };

  const channelOptions = useMemo(() => {
    const values = [
      ...new Set(complaints.map((item) => formatSource(item.source))),
    ].filter(Boolean);

    return ["Tous", ...values];
  }, [complaints]);

  const categoryOptions = useMemo(() => {
    const values = [
      ...new Set(complaints.map((item) => normalizeCategory(item))),
    ].filter(Boolean);

    return ["Toutes", ...values];
  }, [complaints]);

  const statusOptions = ["Tous", "EN_ATTENTE", "EN_COURS", "TRAITEE"];
  const periodOptions = ["30 derniers jours", "7 derniers jours", "Aujourd'hui"];

  const baseFilteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const classified = !isNotClassified(item);
      const formattedSource = formatSource(item.source);
      const itemCategory = normalizeCategory(item);

      if (activeTab === "non-classees" && classified) return false;
      if (activeTab === "classees" && !classified) return false;

      if (channelFilter !== "Tous" && formattedSource !== channelFilter) {
        return false;
      }

      if (categoryFilter !== "Toutes" && itemCategory !== categoryFilter) {
        return false;
      }

      const text = `${item.text_original || ""} ${itemCategory || ""} ${
        formattedSource || ""
      }`.toLowerCase();

      if (searchTerm && !text.includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (periodFilter !== "30 derniers jours") {
        const complaintDate = parseDate(item.comment_date);
        const today = new Date();

        if (!complaintDate) return false;

        if (periodFilter === "7 derniers jours") {
          const diffDays = (today - complaintDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        }

        if (periodFilter === "Aujourd'hui") {
          const sameDay =
            complaintDate.getDate() === today.getDate() &&
            complaintDate.getMonth() === today.getMonth() &&
            complaintDate.getFullYear() === today.getFullYear();

          if (!sameDay) return false;
        }
      }

      return true;
    });
  }, [
    complaints,
    activeTab,
    channelFilter,
    categoryFilter,
    periodFilter,
    searchTerm,
  ]);

  const filteredComplaints = useMemo(() => {
    if (statusFilter === "Tous") return baseFilteredComplaints;
    return baseFilteredComplaints.filter((item) => item.status === statusFilter);
  }, [baseFilteredComplaints, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: baseFilteredComplaints.length,
      enCours: baseFilteredComplaints.filter((item) => item.status === "EN_COURS")
        .length,
      traitees: baseFilteredComplaints.filter((item) => item.status === "TRAITEE")
        .length,
      enAttente: baseFilteredComplaints.filter(
        (item) => item.status === "EN_ATTENTE"
      ).length,
    };
  }, [baseFilteredComplaints]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    channelFilter,
    categoryFilter,
    statusFilter,
    periodFilter,
    searchTerm,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredComplaints.length / itemsPerPage)
  );

  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredComplaints.slice(start, end);
  }, [filteredComplaints, currentPage]);

  const categoryStats = useMemo(() => {
  const sourceData = user?.role === "AGENT" ? allComplaints : complaints;

  const counts = {};

  sourceData.forEach((item) => {
    const category = normalizeCategory(item);
    counts[category] = (counts[category] || 0) + 1;
  });

  const categoryOrder = [
    "SERVICE CLIENT",
    "SINISTRE AUTO",
    "SINISTRE VIE",
    "SINISTRE IRDS",
    "NON CLASSÉE",
  ];

  const categoryColors = {
    "SERVICE CLIENT": "#166534",
    "SINISTRE AUTO": "#2563eb",
    "SINISTRE VIE": "#65b36f",
    "SINISTRE IRDS": "#a9d798",
    "NON CLASSÉE": "#e97667",
  };

  return categoryOrder.map((label) => ({
    label,
    value: counts[label] || 0,
    color: categoryColors[label],
    active: user?.role === "AGENT" && user?.assignedCategory === label,
  }));
}, [complaints, allComplaints, user]);

  const channelStats = useMemo(() => {
    const counts = {};

    complaints.forEach((item) => {
      const source = formatSource(item.source) || "Inconnu";
      counts[source] = (counts[source] || 0) + 1;
    });

    const total = complaints.length || 1;

    return Object.entries(counts)
      .map(([label, value]) => ({
        label,
        value,
        percent: `${Math.round((value / total) * 100)}%`,
        width: `${Math.max((value / total) * 100, 8)}%`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [complaints]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

 return (
  <div style={styles.page}>
    {pageLoading && <PageLoader />}

    {loading && <p>Chargement...</p>}
    {error && <p style={styles.errorText}>{error}</p>}

    {!loading && !error && (
      <>
        <div style={styles.filtersBar}>
          <div style={styles.filtersAll}>

            <CompactFilter
              label="Canal"
              value={channelFilter}
              onChange={(value) => runWithLoader(() => setChannelFilter(value))}
              options={channelOptions}
            />

            <CompactFilter
              label="Catégorie"
              value={categoryFilter}
              onChange={(value) => runWithLoader(() => setCategoryFilter(value))}
              options={categoryOptions}
            />

            <CompactFilter
              label="Statut"
              value={statusFilter}
              onChange={(value) => runWithLoader(() => setStatusFilter(value))}
              options={statusOptions}
            />

            <CompactFilter
              label="Période"
              value={periodFilter}
              onChange={(value) => runWithLoader(() => setPeriodFilter(value))}
              options={periodOptions}
            />

            {/* 🔍 Recherche */}
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Rechercher une réclamation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInputPro}
              />
            </div>

            {/* 🔁 Bouton */}
            <button
              style={styles.resetButtonPro}
              onClick={resetFilters}
            >
              <span style={styles.resetIcon}>↻</span>
              Réinitialiser
            </button>

          </div>
        </div>

          <div style={styles.statsGrid}>
            

           <StatCard
  title="Total Réclamations"
  value={stats.total}
  color="#7aa9ff"
  active={statusFilter === "Tous"}
  onClick={() => runWithLoader(() => setStatusFilter("Tous"))}
/>

<StatCard
  title="En cours"
  value={stats.enCours}
  color="#e8be59"
  active={statusFilter === "EN_COURS"}
  onClick={() => runWithLoader(() => setStatusFilter("EN_COURS"))}
/>

<StatCard
  title="Traitées"
  value={stats.traitees}
  color="#65b36f"
  active={statusFilter === "TRAITEE"}
  onClick={() => runWithLoader(() => setStatusFilter("TRAITEE"))}
/>

<StatCard
  title="En attente"
  value={stats.enAttente}
  color="#e97667"
  active={statusFilter === "EN_ATTENTE"}
  onClick={() => runWithLoader(() => setStatusFilter("EN_ATTENTE"))}
/>
          </div>

          <div style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <h3 style={styles.cardTitle}>Réclamations par Catégorie</h3>

                {categoryFilter !== "Toutes" && (
                  <button
                    style={styles.clearChartFilter}
                    onClick={() => runWithLoader(() => setStatusFilter("EN_ATTENTE"))}
                  >
                    Toutes
                  </button>
                )}
              </div>

              <CategoryOverview
  data={categoryStats}
  selectedCategory={categoryFilter}
  user={user}
  onSelect={(label) =>
    runWithLoader(() =>
      setCategoryFilter(categoryFilter === label ? "Toutes" : label)
    )
  }
/>
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartTitleRow}>
                <h3 style={styles.cardTitle}>Répartition par Canal</h3>

                {channelFilter !== "Tous" && (
                  <button
                    style={styles.clearChartFilter}
                    onClick={() => setChannelFilter("Tous")}
                  >
                    Tous
                  </button>
                )}
              </div>

              {channelStats.length > 0 ? (
                channelStats.map((item) => (
                  <ChannelRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    percent={item.percent}
                    width={item.width}
                    isActive={
                      channelFilter === "Tous" || channelFilter === item.label
                    }
                    isHovered={hoveredChannel === item.label}
                    onMouseEnter={() => setHoveredChannel(item.label)}
                    onMouseLeave={() => setHoveredChannel(null)}
                    onClick={() =>
                      setChannelFilter(
                        channelFilter === item.label ? "Tous" : item.label
                      )
                    }
                  />
                ))
              ) : (
                <p style={styles.emptyText}>Aucune donnée canal.</p>
              )}
            </div>
          </div>

          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "toutes" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("toutes")}
            >
              Toutes ({filteredComplaints.length})
            </button>

            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "non-classees" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("non-classees")}
            >
              Non classées (
              {filteredComplaints.filter((c) => isNotClassified(c)).length})
            </button>

            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "classees" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("classees")}
            >
              Classées (
              {filteredComplaints.filter((c) => !isNotClassified(c)).length})
            </button>
          </div>

          <div style={styles.card}>
            <div style={styles.paginationTop}>
              <div style={styles.paginationRight}>
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
                  }}
                >
                  ⬅️
                </button>

                <span style={styles.paginationText}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === totalPages
                      ? styles.pageButtonDisabled
                      : {}),
                  }}
                >
                  ➡️
                </button>
              </div>
            </div>

            <ComplaintTable data={paginatedComplaints} />
          </div>
        </>
      )}
    </div>
  );
}
function CategoryOverview({ data, selectedCategory, onSelect, user }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length || total === 0) {
    return <p style={styles.emptyText}>Aucune donnée catégorie.</p>;
  }

  const activeCategory =
    user?.role === "AGENT" ? user?.assignedCategory : selectedCategory;

  const activeItem =
    data.find((item) => item.label === activeCategory) ||
    data.find((item) => item.value > 0) ||
    data[0];

  const percent = total ? Math.round((activeItem.value / total) * 100) : 0;

  const radius = 105;
  const circumference = Math.PI * radius;
  const progress = (percent / 100) * circumference;

  return (
    <div style={styles.semiChartBox}>
      <svg width="360" height="200" viewBox="0 0 360 200">
  {/* fond */}
  <path
    d="M75 155 A105 105 0 0 1 285 155"
    fill="none"
    stroke="#e5e7eb"
    strokeWidth="26"
    strokeLinecap="round"
  />

  {/* arc actif */}
  <path
    d="M75 155 A105 105 0 0 1 285 155"
    fill="none"
    stroke={activeItem.color || "#166534"}
    strokeWidth="26"
    strokeLinecap="round"
    strokeDasharray={`${progress} ${circumference}`}
  />

  {/* 🔥 labels autour */}
 {(() => {
  let cumulative = 0;

  return data.map((item) => {
    const p = item.value / total;
    const mid = cumulative + p / 2;
    cumulative += p;

    const angle = Math.PI * (1 - mid);

    const r1 = 105; // bord du demi cercle
    const r2 = 125; // longueur ligne

    const x1 = 180 + r1 * Math.cos(angle);
    const y1 = 155 - r1 * Math.sin(angle);

    const x2 = 180 + r2 * Math.cos(angle);
    const y2 = 155 - r2 * Math.sin(angle);

    return (
      <line
        key={item.label}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={item.color}
        strokeWidth="2"
      />
    );
  });
})()}
</svg>

      <div style={styles.semiChartCenter}>
        <h2 style={styles.semiPercent}>{percent}%</h2>
        <p style={styles.semiLabel}>{activeItem.label}</p>
        <span style={styles.semiValue}>
          {activeItem.value} / {total} réclamations
        </span>
      </div>

      <div style={styles.semiLegend}>
        {data.map((item) => {
          const itemPercent = total
            ? Math.round((item.value / total) * 100)
            : 0;

          return (
            <button
              key={item.label}
              style={{
                ...styles.legendItem,
                ...(item.label === activeItem.label
                  ? styles.legendItemActive
                  : {}),
              }}
              onClick={() => onSelect(item.label)}
            >
              <span
                style={{
                  ...styles.legendDot,
                  background: item.color,
                }}
              />
              {item.label} {itemPercent}%
            </button>
          );
        })}
      </div>
    </div>
  );
}
function CompactFilter({ label, value, onChange, options }) {
  return (
    <div style={styles.compactFilter}>
      <span style={styles.compactLabel}>{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.compactSelect}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatStatus(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  active,
  hovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...styles.statCard,
        ...(active ? styles.statCardActive : {}),
        ...(hovered ? styles.statCardHover : {}),
      }}
      title={`Filtrer par ${title}`}
    >
      <div style={styles.statLeft}>
        <div
          style={{
            ...styles.statIcon,
            background: `${color}22`,
            color,
            boxShadow: active ? `0 10px 22px ${color}44` : "none",
          }}
        >
          ●
        </div>

        <div>
          <p style={styles.statTitle}>{title}</p>
          <h2 style={styles.statValue}>{value}</h2>
        </div>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            width: value > 0 ? "64%" : "0%",
          }}
        />
      </div>
    </div>
  );
}

function ChannelRow({
  label,
  value,
  percent,
  width,
  onClick,
  isActive,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}) {
  return (
    <div
      style={{
        ...styles.channelRow,
        cursor: "pointer",
        transform: isHovered ? "translateX(6px)" : "translateX(0)",
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`Filtrer par ${label}`}
    >
      <div style={styles.channelLabelBox}>
        <span
          style={{
            ...getChannelBadgeStyle(label),
            opacity: isActive ? 1 : 0.62,
          }}
        >
          {label}
        </span>
      </div>

      <div style={styles.channelBarArea}>
        <div style={styles.tooltipWrapFull}>
          {isHovered && (
            <div style={styles.tooltipChannel}>
              <strong>{label}</strong>
              <span>{value} réclamation(s)</span>
              <span>{percent}</span>
            </div>
          )}

          <div style={styles.channelTrack}>
            <div
              style={{
                ...styles.channelFill,
                width,
                background: isActive
                  ? "linear-gradient(90deg, #2563eb, #60a5fa)"
                  : "linear-gradient(90deg, #bfdbfe, #dbeafe)",
                boxShadow: isHovered
                  ? "0 8px 18px rgba(37,99,235,0.25)"
                  : "none",
              }}
            />
          </div>
        </div>

        <span style={{ ...styles.channelValue, opacity: isActive ? 1 : 0.62 }}>
          {value}
        </span>

        <span
          style={{ ...styles.channelPercent, opacity: isActive ? 1 : 0.62 }}
        >
          {percent}
        </span>
      </div>
    </div>
  );
}

function parseDate(dateString) {
  if (!dateString) return null;

  const parts = dateString.split("/");

  if (parts.length === 3) {
    const [day, month, year] = parts;
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSource(source) {
  if (!source) return "Inconnu";
  if (source.toLowerCase() === "facebook") return "Facebook";
  if (source.toLowerCase() === "linkedin") return "LinkedIn";
  return source;
}

function formatStatus(status) {
  if (status === "EN_ATTENTE") return "En attente";
  if (status === "EN_COURS") return "En cours";
  if (status === "TRAITEE") return "Traitée";
  if (status === "Tous") return "Tous";
  if (status === "Toutes") return "Toutes";
  if (status === "NON CLASSÉE") return "Non classée";
  return status;
}

function getChannelBadgeStyle(label) {
  return {
    display: "inline-block",
    minWidth: "92px",
    textAlign: "center",
    padding: "8px 14px",
    borderRadius: "12px",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    background:
      label === "Facebook"
        ? "linear-gradient(135deg, #2563eb, #60a5fa)"
        : "linear-gradient(135deg, #1d4ed8, #38bdf8)",
    boxShadow: "0 8px 18px rgba(37,99,235,0.18)",
    transition: "all 0.25s ease",
  };
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  filtersBar: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  filtersAll: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
    width: "100%",
  },

  filtersLeft: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  filtersRight: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    marginLeft: "auto",
  },

  compactFilter: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "150px",
  },

  compactLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    paddingLeft: "2px",
  },

  compactSelect: {
    height: "42px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "0 14px",
    color: "#1e293b",
    fontSize: "14px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
  },

  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    height: "42px",
    flex: 1,      
    minWidth: "250px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "0 14px",
  },

  searchIcon: {
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: "700",
  },
singleCategoryBox: {
  height: "250px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #ecfdf5, #ffffff)",
  border: "1px solid #bbf7d0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "inset 0 0 0 1px rgba(22,101,52,0.04)",
},
semiChartBox: {
  height: "310px",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
},

semiChartCenter: {
  position: "absolute",
  top: "112px",
  textAlign: "center",
},
semiPercent: {
  margin: 0,
  fontSize: "44px",
  color: "#0f172a",
  fontWeight: "900",
},

semiLabel: {
  margin: "4px 0",
  color: "#166534",
  fontSize: "15px",
  fontWeight: "800",
},

semiValue: {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
},

semiLegend: {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "8px",
  marginTop: "8px",
},

legendItem: {
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#475569",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
},

legendItemActive: {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
},

legendDot: {
  width: "9px",
  height: "9px",
  borderRadius: "50%",
},
singleIcon: {
  width: "54px",
  height: "54px",
  borderRadius: "18px",
  background: "#166534",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: "800",
  marginBottom: "14px",
},

singleLabel: {
  margin: 0,
  color: "#166534",
  fontSize: "18px",
  fontWeight: "800",
},

singleValue: {
  margin: "10px 0",
  color: "#0f172a",
  fontSize: "52px",
  lineHeight: 1,
},

singleSubtext: {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "600",
},

categoryGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "14px",
  marginTop: "18px",
},

categoryMiniCard: {
  border: "2px solid #e2e8f0",
  background: "#ffffff",
  borderRadius: "18px",
  padding: "16px",
  textAlign: "left",
  cursor: "pointer",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  gap: "8px",
  alignItems: "center",
},

categoryDot: {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
},

categoryMiniLabel: {
  fontSize: "13px",
  color: "#334155",
  fontWeight: "800",
},

categoryMiniValue: {
  fontSize: "22px",
  color: "#0f172a",
},

categoryMiniPercent: {
  gridColumn: "2 / 4",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
},
  searchInputPro: {
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    color: "#1e293b",
    fontSize: "14px",
  },

  resetButtonPro: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    height: "42px",
    padding: "0 16px",
    borderRadius: "14px",
    border: "1px solid #dbe3ef",
    background: "#ffffff",
    color: "#475569",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },

  resetButtonProHover: {
    background: "#f1f5f9",
    transform: "translateY(-1px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },

  resetIcon: {
    fontSize: "16px",
    color: "#64748b",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },

  statCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    cursor: "pointer",
    border: "2px solid transparent",
    transition: "all 0.25s ease",
  },

  statCardActive: {
    border: "2px solid #166534",
    boxShadow: "0 18px 36px rgba(22, 101, 52, 0.16)",
    transform: "translateY(-3px)",
  },

  statCardHover: {
    transform: "translateY(-5px)",
    boxShadow: "0 18px 36px rgba(15, 23, 42, 0.12)",
  },

  statLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  statIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "700",
    transition: "all 0.25s ease",
  },

  statTitle: {
    margin: 0,
    color: "#475569",
    fontSize: "15px",
    fontWeight: "600",
  },

  statValue: {
    margin: "6px 0 0 0",
    fontSize: "34px",
    color: "#24324a",
  },

  progressTrack: {
    width: "100%",
    height: "8px",
    background: "#edf2f7",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "all 0.25s ease",
  },

  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  chartCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
    minHeight: "310px",
    overflow: "visible",
  },

  chartTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#24324a",
  },

  pieChartBox: {
    width: "100%",
    height: "300px",
  },

  clearChartFilter: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: "999px",
    padding: "6px 12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  channelRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "22px",
    transition: "all 0.25s ease",
  },

  channelLabelBox: {
    minWidth: "110px",
  },

  channelBarArea: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  channelTrack: {
    flex: 1,
    height: "22px",
    background: "#eef3fb",
    borderRadius: "8px",
    overflow: "hidden",
  },

  channelFill: {
    height: "100%",
    borderRadius: "8px",
    transition: "all 0.25s ease",
  },

  channelValue: {
    color: "#24324a",
    fontWeight: "700",
    minWidth: "36px",
    transition: "all 0.25s ease",
  },

  channelPercent: {
    color: "#6b87b6",
    fontWeight: "600",
    minWidth: "40px",
    transition: "all 0.25s ease",
  },

  tooltipWrapFull: {
    position: "relative",
    flex: 1,
  },

  tooltipChannel: {
    position: "absolute",
    bottom: "130%",
    left: "20px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    boxShadow: "0 12px 28px rgba(15,23,42,0.16)",
    padding: "10px 12px",
    minWidth: "160px",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
    color: "#1e293b",
  },

  tabs: {
    display: "flex",
    gap: "12px",
    marginBottom: "4px",
  },

  tabButton: {
    padding: "8px 16px",
    borderRadius: "999px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  activeTab: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },

  card: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    overflowX: "auto",
  },

  paginationTop: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "12px",
  },

  paginationRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  paginationText: {
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },

  pageButton: {
    minWidth: "40px",
    height: "36px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "16px",
    cursor: "pointer",
    padding: "0 12px",
  },
  gaugeBox: {
  height: "270px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
},

gaugeCenter: {
  marginTop: "-78px",
  textAlign: "center",
},

gaugeValue: {
  margin: 0,
  fontSize: "42px",
  color: "#0f172a",
  fontWeight: "800",
},

gaugeLabel: {
  margin: "6px 0 0",
  color: "#166534",
  fontSize: "15px",
  fontWeight: "800",
},

gaugeFooter: {
  width: "245px",
  marginTop: "28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#64748b",
  fontSize: "13px",
},
categoryRanking: {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "18px",
},

categoryRankRow: {
  width: "100%",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  borderRadius: "16px",
  padding: "14px",
  cursor: "pointer",
  textAlign: "left",
},

categoryRankRowActive: {
  border: "2px solid #166534",
  background: "#f0fdf4",
},

categoryRankTop: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
},

categoryRankName: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  fontWeight: "800",
  color: "#334155",
},

categoryRankDot: {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
},

categoryRankPercent: {
  fontSize: "18px",
  color: "#0f172a",
},

categoryRankBottom: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
},

categoryRankTrack: {
  flex: 1,
  height: "9px",
  background: "#eef2f7",
  borderRadius: "999px",
  overflow: "hidden",
},

categoryRankFill: {
  height: "100%",
  borderRadius: "999px",
},

categoryRankValue: {
  minWidth: "120px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#64748b",
},
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  emptyText: {
    color: "#64748b",
    fontSize: "14px",
  },

  errorText: {
    color: "#dc2626",
    fontWeight: "600",
  },
};

export default DashboardPage;