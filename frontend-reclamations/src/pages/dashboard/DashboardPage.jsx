import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import ComplaintTable from "../../components/complaints/ComplaintTable";
import PageLoader from "../../components/common/PageLoader";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
function DashboardPage() {
  const [startDate, setStartDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [endDate, setEndDate] = useState("");
  const { user } = useContext(AuthContext);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [allComplaints, setAllComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("toutes");
  const [channelFilter, setChannelFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredChannel, setHoveredChannel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
const [range, setRange] = useState([
  {
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  },
]);
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
          const feedbackResponse = await fetch("http://127.0.0.1:8000/api/feedback-stats/");

if (feedbackResponse.ok) {
  const feedbackData = await feedbackResponse.json();
  setFeedbackStats(feedbackData);
}
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
    setSearchTerm("");
    setActiveTab("toutes");
    setStartDate("");
    setEndDate("");
    setShowCalendar(false);
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
  const tabCounts = useMemo(() => {
  const filteredWithoutTab = complaints.filter((item) => {
    const formattedSource = formatSource(item.source);
    const itemCategory = normalizeCategory(item);

    if (channelFilter !== "Tous" && formattedSource !== channelFilter) {
      return false;
    }

    if (categoryFilter !== "Toutes" && itemCategory !== categoryFilter) {
      return false;
    }

    if (statusFilter !== "Tous" && item.status !== statusFilter) {
      return false;
    }

    const text = `${item.text_original || ""} ${itemCategory || ""} ${
      formattedSource || ""
    }`.toLowerCase();

    if (searchTerm && !text.includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  return {
    toutes: filteredWithoutTab.length,
    nonClassees: filteredWithoutTab.filter((c) => isNotClassified(c)).length,
    classees: filteredWithoutTab.filter((c) => !isNotClassified(c)).length,
  };
}, [complaints, channelFilter, categoryFilter, statusFilter, searchTerm]);
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

      if (startDate || endDate) {
  const complaintDate = parseDate(item.comment_date);
  if (!complaintDate) return false;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`);
    if (complaintDate < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59`);
    if (complaintDate > end) return false;
  }
}

      return true;
    });
  }, [
   complaints,
  activeTab,
  channelFilter,
  categoryFilter,
  searchTerm,
  startDate,
  endDate,
  ]);

  const filteredComplaints = useMemo(() => {
    if (statusFilter === "Tous") return baseFilteredComplaints;
    return baseFilteredComplaints.filter((item) => item.status === statusFilter);
  }, [baseFilteredComplaints, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: baseFilteredComplaints.length,
      enCours: baseFilteredComplaints.filter((item) => item.status === "EN_COURS").length,
      traitees: baseFilteredComplaints.filter((item) => item.status === "TRAITEE").length,
      enAttente: baseFilteredComplaints.filter((item) => item.status === "EN_ATTENTE").length,
    };
  }, [baseFilteredComplaints]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    channelFilter,
    categoryFilter,
    statusFilter,
    searchTerm,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / itemsPerPage));

 const paginatedComplaints = useMemo(() => {
  const urgencyOrder = {
    elevee: 1,
    moyenne: 2,
    faible: 3,
  };

  const sorted = [...filteredComplaints].sort((a, b) => {
    return (urgencyOrder[a.urgency] || 99) - (urgencyOrder[b.urgency] || 99);
  });

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  return sorted.slice(start, end);
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
      "SERVICE CLIENT": "#3f8d69",
      "SINISTRE AUTO": "#5d97e6",
      "SINISTRE VIE": "#7ebd85",
      "SINISTRE IRDS": "#a9d798",
      "NON CLASSÉE": "#e97667",
    };

    if (user?.role === "ADMIN") {
      return categoryOrder
        .filter((label) => counts[label])
        .map((label) => ({
          label,
          value: counts[label],
          color: categoryColors[label],
        }));
    }

    return categoryOrder.map((label) => ({
      label,
      value: counts[label] || 0,
      color: categoryColors[label],
    }));
  }, [complaints, allComplaints, user]);
  const genderStats = useMemo(() => {
  const counts = {
    Homme: 0,
    Femme: 0,
    Autre: 0,
  };

  complaints.forEach((item) => {
    const gender = item.author_gender || "Autre";

    if (gender === "Homme") counts.Homme++;
    else if (gender === "Femme") counts.Femme++;
    else counts.Autre++;
  });

  const total = complaints.length || 1;

  return [
    {
      label: "Homme",
      value: counts.Homme,
      percent: Math.round((counts.Homme / total) * 100),
      color: "#2563eb",
    },
    {
      label: "Femme",
      value: counts.Femme,
      percent: Math.round((counts.Femme / total) * 100),
      color: "#db2777",
    },
    {
      label: "Autre",
      value: counts.Autre,
      percent: Math.round((counts.Autre / total) * 100),
      color: "#64748b",
    },
  ];
}, [complaints]);
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

  return (
    <div style={styles.page}>
      {pageLoading && <PageLoader />}

      {loading && <p>Chargement...</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={styles.filtersBar}>
            <div style={styles.filtersAll}>
             <div style={styles.dateRangeWrapper}>
  <span style={styles.compactLabel}>Période</span>

  <button
    type="button"
    style={styles.dateRangeButton}
    onClick={() => setShowCalendar(!showCalendar)}
  >
    {startDate && endDate
      ? `${startDate} → ${endDate}`
      : "Choisir une période"}
    📅
  </button>

 {showCalendar && (
  <div style={styles.calendarDropdown}>
    <DateRange
      editableDateInputs={true}
      onChange={(item) => setRange([item.selection])}
      moveRangeOnFirstSelection={false}
      ranges={range}
    />

    <button
      style={styles.calendarApplyBtn}
      onClick={() => setShowCalendar(false)}
    >
      Appliquer
    </button>
  </div>
)}
</div>

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

              <button style={styles.resetButtonPro} onClick={resetFilters}>
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
                    onClick={() => runWithLoader(() => setCategoryFilter("Toutes"))}
                  >
                    Toutes
                  </button>
                )}
              </div>

              {user?.role === "ADMIN" ? (
                <AdminCategoryPie
                  data={categoryStats}
                  selectedCategory={categoryFilter}
                  onSelect={(label) =>
                    runWithLoader(() =>
                      setCategoryFilter(categoryFilter === label ? "Toutes" : label)
                    )
                  }
                />
              ) : (
                <AgentCategoryGauge
                  data={categoryStats}
                  user={user}
                />
              )}
            </div>
            
            <div style={styles.fullWidthChartCard}>
  <div style={styles.chartTitleRow}>
    <h3 style={styles.cardTitle}>Répartition par Sexe</h3>
  </div>
              
  <GenderChart data={genderStats} />
</div>
          <div style={styles.smallChartCard}>
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
                    isActive={channelFilter === "Tous" || channelFilter === item.label}
                    isHovered={hoveredChannel === item.label}
                    onMouseEnter={() => setHoveredChannel(item.label)}
                    onMouseLeave={() => setHoveredChannel(null)}
                    onClick={() =>
                      setChannelFilter(channelFilter === item.label ? "Tous" : item.label)
                    }
                  />
                ))
              ) : (
                <p style={styles.emptyText}>Aucune donnée canal.</p>
              )}
            </div>
            <div style={styles.chartCard}>
  <div style={styles.chartTitleRow}>
    <h3 style={styles.cardTitle}>Feedbacks positifs</h3>
  </div>

  <FeedbackChart data={feedbackStats} />
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
    Toutes ({tabCounts.toutes})
  </button>

  <button
    style={{
      ...styles.tabButton,
      ...(activeTab === "non-classees" ? styles.activeTab : {}),
    }}
    onClick={() => setActiveTab("non-classees")}
  >
    Non classées ({tabCounts.nonClassees})
  </button>

  <button
    style={{
      ...styles.tabButton,
      ...(activeTab === "classees" ? styles.activeTab : {}),
    }}
    onClick={() => setActiveTab("classees")}
  >
    Classées ({tabCounts.classees})
  </button>
</div>
          <div style={styles.card}>
            <div style={styles.paginationTop}>
              <div style={styles.paginationRight}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === totalPages ? styles.pageButtonDisabled : {}),
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
function FeedbackChart({ data }) {
  if (!data) return <p style={styles.emptyText}>Chargement...</p>;

  const total = data.total || 1;
  const goodPercent = Math.round((data.good_feedbacks / total) * 100);
  const badPercent = Math.round((data.reclamations / total) * 100);

  const cx = 180;
  const cy = 155;
  const radius = 120;
  const needleLength = 88;

  const getPoint = (percent, r = radius) => {
    const angle = 180 - (percent / 100) * 180;
    const rad = (angle * Math.PI) / 180;

    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  const arcPath = (startPercent, endPercent) => {
    const start = getPoint(startPercent);
    const end = getPoint(endPercent);
    const largeArcFlag = endPercent - startPercent > 50 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const needle = getPoint(goodPercent, needleLength);

  const status =
    goodPercent >= 70
      ? "Très positif"
      : goodPercent >= 40
      ? "Équilibré"
      : "À surveiller";

  return (
    <div style={styles.feedbackGaugeBox}>
      <svg width="420" height="260" viewBox="0 0 420 260">
        <path
          d={arcPath(0, 100)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="34"
          strokeLinecap="round"
        />

        <path
          d={arcPath(0, 40)}
          fill="none"
          stroke="#ef4444"
          strokeWidth="34"
          strokeLinecap="round"
        />

        <path
          d={arcPath(40, 70)}
          fill="none"
          stroke="#facc15"
          strokeWidth="34"
          strokeLinecap="round"
        />

        <path
          d={arcPath(70, 100)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="34"
          strokeLinecap="round"
        />

        <line
          x1={cx}
          y1={cy}
          x2={needle.x}
          y2={needle.y}
          stroke="#0f172a"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <circle cx={cx} cy={cy} r="16" fill="#0f172a" />
        <circle cx={cx} cy={cy} r="6" fill="#ffffff" />

        <text x="60" y="205" textAnchor="middle" style={styles.gaugeText}>
          0%
        </text>

        <text x="300" y="205" textAnchor="middle" style={styles.gaugeText}>
          100%
        </text>
      </svg>

      <div style={styles.feedbackGaugeContent}>
        <h2 style={styles.feedbackGaugePercent}>{goodPercent}%</h2>
        <p style={styles.feedbackGaugeLabel}>Feedbacks positifs</p>
        <span style={styles.feedbackGaugeStatus}>{status}</span>
      </div>

      <div style={styles.feedbackGaugeStats}>
        <span>💚 {data.good_feedbacks} positifs</span>
        <span>🔴 {data.reclamations} réclamations</span>
        <span>{badPercent}% réclamations</span>
      </div>
    </div>
  );
}
function AdminCategoryPie({ data, selectedCategory, onSelect }) {
  if (!data.length) {
    return <p style={styles.emptyText}>Aucune donnée catégorie.</p>;
  }

  return (
    <div style={styles.pieChartBox}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={95}
            label={({ label, percent }) =>
              `${label} ${(percent * 100).toFixed(0)}%`
            }
            onClick={(data) => onSelect(data.label)}
          >
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.color}
                opacity={
                  selectedCategory === "Toutes" ||
                  selectedCategory === entry.label
                    ? 1
                    : 0.35
                }
                style={{ cursor: "pointer" }}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, name) => [`${value} réclamation(s)`, name]}
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function AgentCategoryGauge({ data, user }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length || total === 0) {
    return <p style={styles.emptyText}>Aucune donnée catégorie.</p>;
  }

  const activeItem =
    data.find((item) => item.label === user?.assignedCategory) ||
    data.find((item) => item.value > 0) ||
    data[0];

  const percent = Math.round((activeItem.value / total) * 100);
  const radius = 105;
  const circumference = Math.PI * radius;
  const progress = (percent / 100) * circumference;

  return (
    <div style={styles.semiChartBox}>
      <svg width="360" height="190" viewBox="0 0 360 190">
        <path
          d="M75 155 A105 105 0 0 1 285 155"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="26"
          strokeLinecap="round"
        />

        <path
          d="M75 155 A105 105 0 0 1 285 155"
          fill="none"
          stroke="#166534"
          strokeWidth="26"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
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
          const itemPercent = Math.round((item.value / total) * 100);

          return (
            <span
              key={item.label}
              style={{
                ...styles.legendItem,
                ...(item.label === activeItem.label ? styles.legendItemActive : {}),
              }}
            >
              <span
                style={{
                  ...styles.legendDot,
                  background: item.color,
                }}
              />
              {item.label} {itemPercent}%
            </span>
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

function StatCard({ title, value, color, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.statCard,
        ...(active ? styles.statCardActive : {}),
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
    >
      <div style={styles.channelLabelBox}>
        <span style={{ ...getChannelBadgeStyle(label), opacity: isActive ? 1 : 0.62 }}>
          {label}
        </span>
      </div>

      <div style={styles.channelBarArea}>
        <div style={styles.channelTrack}>
          <div
            style={{
              ...styles.channelFill,
              width,
              background: isActive
                ? "linear-gradient(90deg, #2563eb, #60a5fa)"
                : "linear-gradient(90deg, #bfdbfe, #dbeafe)",
            }}
          />
        </div>

        <span style={{ ...styles.channelValue, opacity: isActive ? 1 : 0.62 }}>
          {value}
        </span>

        <span style={{ ...styles.channelPercent, opacity: isActive ? 1 : 0.62 }}>
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
function CategoryBarChart({ data }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis dataKey="label" type="category" />
          <Tooltip />

          <Bar dataKey="value" radius={[0, 10, 10, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function GenderChart({ data }) {
  const homme = data.find((item) => item.label === "Homme") || {
    value: 0,
    percent: 0,
  };

  const femme = data.find((item) => item.label === "Femme") || {
    value: 0,
    percent: 0,
  };

  const autre = data.find((item) => item.label === "Autre") || {
    value: 0,
    percent: 0,
  };

  const total = homme.value + femme.value + autre.value;

  if (!total) {
    return <p style={styles.emptyText}>Aucune donnée sexe.</p>;
  }

  return (
    <div style={styles.genderPanel}>
      

<div style={styles.genderVisuals}>
        <div style={styles.genderPerson}>
          <div style={styles.personIconFemale}>♀</div>
          <div style={styles.genderBadgeFemale}>{femme.percent}% Femme</div>
          <p style={styles.genderSmallText}>{femme.value} réclamation(s)</p>
        </div>

        

        <div style={styles.genderPerson}>
          <div style={styles.personIconMale}>♂</div>
          <div style={styles.genderBadgeMale}>{homme.percent}% Homme</div>
          <p style={styles.genderSmallText}>{homme.value} réclamation(s)</p>
        </div>
      </div>

      <div style={styles.otherGenderBox}>
        <span style={styles.otherGenderDot}></span>
        <span>Autre / inconnu</span>
        <strong>{autre.percent}%</strong>
        <small>{autre.value} réclamation(s)</small>
      </div>
    </div>
  );
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
  },

  filtersAll: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
    width: "100%",
  },
  feedbackAnalytics: {
  position: "relative",
  minHeight: "260px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "22px",
  padding: "12px 10px",
},

feedbackCenterLine: {
  position: "absolute",
  left: "50%",
  top: "42px",
  bottom: "90px",
  width: "2px",
  background: "#cbd5e1",
  transform: "translateX(-50%)",
},
smallChartCard: {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  minHeight: "190px",
  overflow: "visible",
},
feedbackRow: {
  display: "grid",
  gridTemplateColumns: "140px 1fr 48px",
  alignItems: "center",
  gap: "12px",
},

feedbackMiniLabel: {
  fontSize: "13px",
  fontWeight: "800",
  color: "#475569",
},

feedbackNegativeBarWrap: {
  height: "18px",
  display: "flex",
  justifyContent: "flex-end",
  background: "transparent",
},

feedbackPositiveBarWrap: {
  height: "18px",
  display: "flex",
  justifyContent: "flex-start",
  background: "transparent",
},

feedbackNegativeBar: {
  height: "100%",
  background: "linear-gradient(90deg, #f87171, #dc2626)",
  borderRadius: "999px 0 0 999px",
},

feedbackPositiveBar: {
  height: "100%",
  background: "linear-gradient(90deg, #22c55e, #86efac)",
  borderRadius: "0 999px 999px 0",
},

feedbackValue: {
  fontSize: "14px",
  fontWeight: "900",
  color: "#0f172a",
},
dateFilter: {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: "20px",
},

dateInputs: {
  display: "flex",
  gap: "8px",
},

dateInput: {
  height: "42px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "0 12px",
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: "600",
  outline: "none",
  cursor: "pointer",
},
feedbackMoodRow: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
  marginTop: "16px",
},

moodItem: {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "14px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  color: "#334155",
},

moodIcon: {
  fontSize: "34px",
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

  searchInputPro: {
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    color: "#1e293b",
    fontSize: "14px",
  },
  genderTop: {
  display: "flex",
  justifyContent: "center",
  marginBottom: "10px",
},

genderTotalBox: {
  background: "linear-gradient(135deg, #ffffff, #f1f5f9)",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px 28px",
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
},

genderTotalNumber: {
  display: "block",
  fontSize: "28px",
  fontWeight: "900",
  color: "#0f172a",
},

genderTotalLabel: {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: "600",
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

  statLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  feedbackGaugeStatus: {
  display: "inline-block",
  marginTop: "4px",
  padding: "6px 14px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "13px",
  fontWeight: "800",
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
  genderPanel: {
  minHeight: "260px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "20px",
},

genderVisuals: {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "24px",
},

genderPerson: {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
},

personIconFemale: {
  width: "95px",
  height: "95px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, #fce7f3, #ffffff)",
  color: "#db2777",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "58px",
  fontWeight: "900",
  boxShadow: "0 14px 28px rgba(219, 39, 119, 0.14)",
  border: "1px solid #fbcfe8",
},
feedbackCleanBox: {
  minHeight: "260px",
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  alignItems: "center",
  gap: "28px",
},

feedbackScoreCircle: {
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #dcfce7, #ffffff)",
  border: "1px solid #bbf7d0",
  boxShadow: "0 18px 35px rgba(22, 163, 74, 0.16)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#166534",
},

feedbackScore: {
  fontSize: "42px",
  fontWeight: "900",
},

feedbackBars: {
  display: "flex",
  flexDirection: "column",
  gap: "22px",
},
feedbackGaugeContent: {
  marginTop: "-76px",
  textAlign: "center",
},
feedbackLineTop: {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  color: "#334155",
  fontWeight: "800",
},

feedbackTrackClean: {
  height: "14px",
  background: "#e2e8f0",
  borderRadius: "999px",
  overflow: "hidden",
},

feedbackPositiveFill: {
  height: "100%",
  background: "linear-gradient(90deg, #16a34a, #86efac)",
  borderRadius: "999px",
},

feedbackNegativeFill: {
  height: "100%",
  background: "linear-gradient(90deg, #ef4444, #fecaca)",
  borderRadius: "999px",
},

feedbackMiniStats: {
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "center",
  gap: "22px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "800",
},

goodDot: {
  display: "inline-block",
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#16a34a",
  marginRight: "6px",
},

badDot: {
  display: "inline-block",
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#ef4444",
  marginRight: "6px",
},
personIconMale: {
  width: "95px",
  height: "95px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, #dbeafe, #ffffff)",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "58px",
  fontWeight: "900",
  boxShadow: "0 14px 28px rgba(37, 99, 235, 0.14)",
  border: "1px solid #bfdbfe",
},

genderBadgeFemale: {
  marginTop: "14px",
  background: "#fce7f3",
  color: "#be185d",
  padding: "8px 16px",
  borderRadius: "999px",
  fontWeight: "800",
  fontSize: "14px",
},

genderBadgeMale: {
  marginTop: "14px",
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "8px 16px",
  borderRadius: "999px",
  fontWeight: "800",
  fontSize: "14px",
},

genderSmallText: {
  margin: "8px 0 0",
  fontSize: "13px",
  color: "#64748b",
  fontWeight: "700",
},

genderDivider: {
  width: "86px",
  height: "86px",
  borderRadius: "50%",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#0f172a",
  fontWeight: "900",
  fontSize: "24px",
},

otherGenderBox: {
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 16px",
  borderRadius: "999px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontWeight: "700",
  fontSize: "13px",
},

otherGenderDot: {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#64748b",
},
  channelValue: {
    color: "#24324a",
    fontWeight: "700",
    minWidth: "36px",
  },

  channelPercent: {
    color: "#6b87b6",
    fontWeight: "600",
    minWidth: "40px",
  },
  dateRangeWrapper: {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: "230px",
},

dateRangeButton: {
  height: "42px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "0 14px",
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
},

calendarDropdown: {
  position: "absolute",
  top: "70px",
  left: 0,
  zIndex: 1000,
  width: "350px",
  background: "#ffffff",
  borderRadius: "22px",
  padding: "14px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
  border: "1px solid #e2e8f0",
},

calendarInput: {
  height: "40px",
  borderRadius: "12px",
  border: "1px solid #334155",
  background: "#1f2937",
  color: "#fff",
  padding: "0 10px",
},

calendarApplyBtn: {
  width: "100%",
  marginTop: "12px",
  border: "none",
  background: "#166534",
  color: "#ffffff",
  borderRadius: "14px",
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "14px",
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
  fullWidthChartCard: {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
},

genderChart: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
},

genderItem: {
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "18px",
  background: "#f8fafc",
},

genderHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
},

genderLabelBox: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
},

genderDot: {
  width: "11px",
  height: "11px",
  borderRadius: "50%",
},

genderLabel: {
  fontSize: "15px",
  fontWeight: "800",
  color: "#334155",
},

genderPercent: {
  fontSize: "24px",
  color: "#0f172a",
},

genderTrack: {
  height: "10px",
  background: "#e2e8f0",
  borderRadius: "999px",
  overflow: "hidden",
},

genderFill: {
  height: "100%",
  borderRadius: "999px",
},

genderCount: {
  margin: "10px 0 0",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
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

  pageButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  feedbackGaugeBox: {
  minHeight: "330px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
},
gaugeText: {
  fontSize: "14px",
  fontWeight: "800",
  fill: "#64748b",
},
feedbackGaugePercent: {
  margin: 0,
  fontSize: "48px",
  fontWeight: "900",
  color: "#166534",
  lineHeight: 1,
},


feedbackGaugeLabel: {
  margin: "6px 0",
  fontSize: "16px",
  fontWeight: "800",
  color: "#1e293b",
},
feedbackGaugeStats: {
  marginTop: "18px",
  display: "flex",
  gap: "18px",
  flexWrap: "wrap",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: "800",
  color: "#475569",
},
  emptyText: {
    color: "#64748b",
    fontSize: "14px",
  },

  errorText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  feedbackBox: {
  minHeight: "260px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "18px",
},

feedbackMain: {
  textAlign: "center",
},

feedbackEmoji: {
  fontSize: "44px",
},

feedbackPercent: {
  margin: "8px 0 0",
  fontSize: "46px",
  fontWeight: "900",
  color: "#166534",
},

feedbackLabel: {
  margin: "4px 0",
  fontSize: "16px",
  fontWeight: "800",
  color: "#14532d",
},

feedbackCount: {
  fontSize: "13px",
  fontWeight: "700",
  color: "#64748b",
},

feedbackTrack: {
  height: "14px",
  background: "#fee2e2",
  borderRadius: "999px",
  overflow: "hidden",
},

feedbackFill: {
  height: "100%",
  background: "linear-gradient(90deg, #16a34a, #86efac)",
  borderRadius: "999px",
},

feedbackFooter: {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px",
  fontWeight: "700",
  color: "#64748b",
},
};

export default DashboardPage;