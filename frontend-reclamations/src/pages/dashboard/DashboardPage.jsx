import { useContext, useEffect, useMemo, useState } from "react";

import { Navigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiClipboard,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";

import { AuthContext } from "../../context/AuthContext";

import ComplaintTable from "../../components/complaints/ComplaintTable";

import PageLoader from "../../components/common/PageLoader";
import SkeletonLoader from "../../components/common/SkeletonLoader";

import {

  PieChart,

  Pie,

  Cell,

  Tooltip,

  Legend,

  ResponsiveContainer,

  AreaChart,

  Area,

  BarChart,

  Bar,

  XAxis,

  YAxis,

  LineChart,

  Line,

  CartesianGrid,

} from "recharts";

import { DateRange } from "react-date-range";

import "react-date-range/dist/styles.css";

import "react-date-range/dist/theme/default.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

import { ThemeContext } from "../../context/ThemeContext";

import {

  MAE_AGENCIES,

  MAE_REGION_COLORS,

  MAE_REGION_STATS,

} from "../../data/maeAgencies";

function DashboardPage() {

  const [startDate, setStartDate] = useState("");

  const [showCalendar, setShowCalendar] = useState(false);

  const [openFilter, setOpenFilter] = useState(null);

  const [endDate, setEndDate] = useState("");

  const { user } = useContext(AuthContext);

  const [feedbackStats, setFeedbackStats] = useState(null);

  const [allComplaints, setAllComplaints] = useState([]);

  const { theme } = useContext(ThemeContext);

  const isDark = theme === "dark";

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

  const [agencySearch, setAgencySearch] = useState("");

  const [agencyRegionFilter, setAgencyRegionFilter] = useState("Toutes");

  const [dashboardWidth, setDashboardWidth] = useState(1440);

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
    const dashboardNode = document.getElementById("dashboard-reclamations-page");

    const updateDashboardWidth = () => {
      setDashboardWidth(dashboardNode?.offsetWidth || window.innerWidth);
    };

    updateDashboardWidth();

    if (typeof ResizeObserver !== "undefined" && dashboardNode) {
      const resizeObserver = new ResizeObserver(updateDashboardWidth);
      resizeObserver.observe(dashboardNode);

      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", updateDashboardWidth);

    return () => window.removeEventListener("resize", updateDashboardWidth);
  }, []);

  useEffect(() => {
    const closeFiltersOnOutsideClick = (event) => {
      if (event.target.closest("[data-dashboard-filter-layer='true']")) {
        return;
      }

      setOpenFilter(null);
      setShowCalendar(false);
    };

    document.addEventListener("mousedown", closeFiltersOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeFiltersOnOutsideClick);
    };
  }, []);

  const isCompactDashboard = dashboardWidth <= 1120;
  const isMobileDashboard = dashboardWidth <= 720;



  useEffect(() => {

    async function loadComplaints() {

      try {

        setLoading(true);



        const params = new URLSearchParams();



        if (user?.role === "AGENT" && user?.assignedCategory) {

          params.append("role", user.role);

          params.append("assigned_category", user.assignedCategory);

        }



        const url = `http://127.0.0.1:8000/api/reclamations/${params.toString() ? `?${params.toString()}` : ""

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

    setOpenFilter(null);

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



      const text = `${item.text_original || ""} ${itemCategory || ""} ${formattedSource || ""

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



      const text = `${item.text_original || ""} ${itemCategory || ""} ${formattedSource || ""

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

      "SERVICE CLIENT": "#166534",

      "SINISTRE AUTO": "#3f8d69",

      "SINISTRE VIE": "#65b36f",

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

  const urgencyStats = useMemo(() => {

    const urgencyConfig = {

      elevee: { label: "Élevée", color: "#e97667", bg: "#fef2f2" },

      moyenne: { label: "Moyenne", color: "#e8be59", bg: "#fffbeb" },

      faible: { label: "Faible", color: "#65b36f", bg: "#f0fdf4" },

    };

    const counts = { elevee: 0, moyenne: 0, faible: 0 };

    complaints.forEach((item) => {

      const urgency = String(item.urgency || "").toLowerCase();

      if (counts[urgency] !== undefined) {

        counts[urgency] += 1;

      }

    });

    const total = complaints.length || 1;

    return Object.entries(urgencyConfig).map(([key, config]) => {

      const value = counts[key] || 0;

      return {

        key,

        value,

        percent: `${Math.round((value / total) * 100)}%`,

        width: `${Math.max((value / total) * 100, value > 0 ? 8 : 0)}%`,

        ...config,

      };

    });

  }, [complaints]);



  const agencyRegions = useMemo(

    () => ["Toutes", ...MAE_REGION_STATS.map((item) => item.region)],

    []

  );



  const filteredMaeAgencies = useMemo(() => {

    const query = agencySearch.trim().toLowerCase();



    return MAE_AGENCIES.filter((agency) => {

      if (agencyRegionFilter !== "Toutes" && agency.region !== agencyRegionFilter) {

        return false;

      }



      if (!query) return true;



      const searchable = [

        agency.name,

        agency.governorate,

        agency.city,

        agency.region,

        agency.address,

        agency.phones.join(" "),

      ]

        .join(" ")

        .toLowerCase();



      return searchable.includes(query);

    });

  }, [agencySearch, agencyRegionFilter]);



  const maxAgencyRegion = MAE_REGION_STATS[0];

  const governorateCount = new Set(

    MAE_AGENCIES.map((agency) => agency.governorate)

  ).size;

  const dashboardExportRows = useMemo(
    () =>
      filteredComplaints.map((item) => ({
        id: item.comment_id ?? item.id,
        client: item.author_name || "",
        canal: formatSource(item.source) || "",
        date: item.comment_date || "",
        categorie: normalizeCategory(item),
        statut: formatStatus(item.status),
        urgence: formatUrgencyLabel(item.urgency),
        reclamation: item.text_original || "",
      })),
    [filteredComplaints]
  );

  const exportDashboardExcel = () => {
    const html = buildExportTableHtml(dashboardExportRows, stats);
    downloadFile(`dashboard-reclamations-${getTodayStamp()}.xls`, html, "application/vnd.ms-excel");
  };

  const exportDashboardPdf = () => {
    const reportWindow = window.open("", "_blank", "width=1100,height=760");
    if (!reportWindow) return;

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Rapport des réclamations</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f8fafc;
              color: #0f172a;
              font-family: "Segoe UI", Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report {
              max-width: 1180px;
              margin: 0 auto;
              padding: 24px;
              background: #ffffff;
            }
            .report-header {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 18px;
              padding: 18px 20px;
              border: 1px solid #bbf7d0;
              border-radius: 18px;
              background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%);
              margin-bottom: 16px;
            }
            .report-kicker {
              margin: 0 0 6px;
              color: #166534;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0;
              text-transform: uppercase;
            }
            h1 {
              margin: 0;
              color: #0f172a;
              font-size: 28px;
              line-height: 1.1;
            }
            .report-date {
              white-space: nowrap;
              border: 1px solid #bbf7d0;
              border-radius: 999px;
              background: #ffffff;
              color: #166534;
              padding: 8px 12px;
              font-size: 12px;
              font-weight: 800;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin: 0 0 16px;
            }
            .stat {
              border: 1px solid #dbe4ee;
              border-radius: 14px;
              padding: 12px 14px;
              background: #ffffff;
            }
            .stat span {
              display: block;
              color: #64748b;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .stat strong {
              display: block;
              margin-top: 5px;
              color: #0f172a;
              font-size: 24px;
              line-height: 1;
            }
            .table-wrap {
              overflow: hidden;
              border: 1px solid #dbe4ee;
              border-radius: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              background: #ffffff;
              font-size: 11px;
            }
            thead { display: table-header-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            th {
              background: #166534;
              color: #ffffff;
              padding: 9px 8px;
              text-align: left;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
            }
            td {
              border-top: 1px solid #e2e8f0;
              padding: 8px;
              vertical-align: top;
              line-height: 1.25;
              word-break: break-word;
            }
            tbody tr:nth-child(even) td { background: #f8fafc; }
            .col-id { width: 5%; }
            .col-client { width: 12%; }
            .col-canal { width: 8%; }
            .col-date { width: 9%; }
            .col-category { width: 12%; }
            .col-status { width: 9%; }
            .col-urgency { width: 8%; }
            .col-complaint { width: 37%; }
            .badge {
              display: inline-block;
              border-radius: 999px;
              padding: 4px 8px;
              font-size: 10px;
              font-weight: 800;
              white-space: nowrap;
            }
            .status-done { background: #dcfce7; color: #166534; }
            .status-progress { background: #fef3c7; color: #92400e; }
            .status-waiting { background: #fee2e2; color: #b91c1c; }
            .urgency-low { background: #dcfce7; color: #166534; }
            .urgency-medium { background: #fef3c7; color: #92400e; }
            .urgency-high { background: #fee2e2; color: #b91c1c; }
            @media print {
              body { background: #ffffff; }
              .report { max-width: none; padding: 0; }
              .report-header, .stat, .table-wrap { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${buildExportTableHtml(dashboardExportRows, stats, true)}
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };



  return (//return principal





    <div id="dashboard-reclamations-page" style={styles.page}>

      {pageLoading && <PageLoader />}



      {loading && <SkeletonLoader type="dashboard" />}

      {error && <p style={styles.errorText}>{error}</p>}



      {!loading && !error && (

        <>

          <div style={{ ...styles.dashboardHero, ...(isDark ? styles.darkCard : {}) }}>

            <div>

              <h1 style={{ ...styles.dashboardTitle, ...(isDark ? styles.darkTitle : {}) }}>Exports des réclamations</h1>

            </div>

            <div style={styles.exportActions}>

              <button
                type="button"
                onClick={exportDashboardPdf}
                style={{ ...styles.exportButton, ...(isDark ? styles.darkButtonControl : {}) }}
              >
                <FiFileText />
                PDF
              </button>

              <button
                type="button"
                onClick={exportDashboardExcel}
                style={{ ...styles.exportButtonPrimary, ...(isDark ? styles.darkButtonControl : {}) }}
              >
                <FiDownload />
                Excel
              </button>

            </div>

          </div>

          <div
            style={{
              ...styles.filtersBar,
              ...(showCalendar && !isMobileDashboard ? styles.filtersBarCalendarOpen : {}),
              ...(isDark ? styles.darkCard : {}),
            }}
          >

            <div
              style={{
                ...styles.filtersAll,
                ...(isCompactDashboard ? styles.filtersAllCompact : {}),
                ...(isMobileDashboard ? styles.filtersAllMobile : {}),
              }}
            >

              <div
                data-dashboard-filter-layer="true"
                style={{
                  ...styles.dateRangeWrapper,
                  ...(isCompactDashboard ? styles.dateRangeWrapperCompact : {}),
                }}
              >

                <span style={styles.compactLabel}>Période</span>



                <button

                  type="button"

                  style={{ ...styles.dateRangeButton, ...(isDark ? styles.darkControl : {}) }}

                  onClick={() => {
                    setOpenFilter(null);
                    setShowCalendar((prev) => !prev);
                  }}

                >

                  <span>

                    {startDate && endDate

                      ? `${startDate} - ${endDate}`

                      : "Choisir une période"}

                  </span>

                  <FiChevronDown />

                </button>



                {showCalendar && (

                  <div
                    style={{
                      ...styles.calendarDropdown,
                      ...(isMobileDashboard ? styles.calendarDropdownMobile : {}),
                      ...(isDark ? styles.darkDropdown : {}),
                    }}
                  >

                    <div style={{ ...styles.calendarWrapper, ...(isDark ? styles.darkCalendarWrapper : {}) }}>



                      {/* Inputs */}





                      {/* Calendar */}

                      <DateRange

                        editableDateInputs={true}

                        onChange={(item) => {

                          setRange([item.selection]);

                          setStartDate(formatLocalDate(item.selection.startDate));

                          setEndDate(formatLocalDate(item.selection.endDate));

                        }}

                        moveRangeOnFirstSelection={false}

                        ranges={range}

                        showMonthAndYearPickers={false}

                      />



                    </div>



                    <button

                      style={styles.calendarApplyBtn}

                      onClick={() => {
                        setShowCalendar(false);
                        setOpenFilter(null);
                      }}

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

                isOpen={openFilter === "category"}

                onToggle={() => {
                  setShowCalendar(false);
                  setOpenFilter((prev) => (prev === "category" ? null : "category"));
                }}

                onClose={() => setOpenFilter(null)}

              />



              <div style={{ ...styles.searchWrap, ...(isDark ? styles.darkSearchWrap : {}) }}>

                <span style={styles.searchIcon}>
                  <FiSearch />
                </span>

                <input

                  type="text"

                  placeholder="Rechercher une réclamation..."

                  value={searchTerm}

                  onChange={(e) => setSearchTerm(e.target.value)}

                  style={{ ...styles.searchInputPro, ...(isDark ? styles.darkSearchInput : {}) }}

                />

              </div>



              <button style={{ ...styles.resetButtonPro, ...(isDark ? styles.darkButtonControl : {}) }} onClick={resetFilters}>

                <span style={styles.resetIcon}>
                  <FiRefreshCw />
                </span>

                Réinitialiser

              </button>

            </div>

          </div>



          <div
            style={{
              ...styles.statsGrid,
              ...(isCompactDashboard ? styles.statsGridCompact : {}),
              ...(isMobileDashboard ? styles.statsGridMobile : {}),
            }}
          >

            <StatCard

              title="Total Réclamations"

              value={stats.total}

              color="#166534"

              icon={<FiClipboard />}

              active={statusFilter === "Tous"}

              onClick={() => runWithLoader(() => setStatusFilter("Tous"))}

            />



            <StatCard

              title="En cours"

              value={stats.enCours}

              color="#f59e0b"

              icon={<FiClock />}

              active={statusFilter === "EN_COURS"}

              onClick={() => runWithLoader(() => setStatusFilter("EN_COURS"))}

            />



            <StatCard

              title="Traitées"

              value={stats.traitees}

              color="#10b981"

              icon={<FiCheckCircle />}

              active={statusFilter === "TRAITEE"}

              onClick={() => runWithLoader(() => setStatusFilter("TRAITEE"))}

            />



            <StatCard

              title="En attente"

              value={stats.enAttente}

              color="#e97667"

              icon={<FiAlertCircle />}

              active={statusFilter === "EN_ATTENTE"}

              onClick={() => runWithLoader(() => setStatusFilter("EN_ATTENTE"))}

            />

          </div>





          <div
            style={{
              ...styles.chartsGrid,
              ...(isCompactDashboard ? styles.chartsGridCompact : {}),
            }}
          >

            <div

              style={{

                ...styles.chartCard,

                ...styles.categoryChartCard,

                ...(isCompactDashboard ? styles.chartCardCompact : {}),

                ...(isDark ? styles.darkCard : {}),

              }}

            >

              <div style={styles.chartTitleRow}>

                <h3 style={{ ...styles.cardTitle, ...(isDark ? styles.darkTitle : {}) }}>Réclamations par Catégorie</h3>



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

                  compact={isCompactDashboard}

                  onSelect={(label) =>

                    runWithLoader(() =>

                      setCategoryFilter(categoryFilter === label ? "Toutes" : label)

                    )

                  }

                />

              ) : (

                <AgentCategoryGauge data={categoryStats} user={user} isDark={isDark} />

              )}

            </div>



            <div

              style={{

                ...styles.chartCard,

                ...styles.channelChartCard,

                ...(isCompactDashboard ? styles.chartCardCompact : {}),

                ...(isDark ? styles.darkCard : {}),

              }}

            >

              <div style={styles.chartTitleRow}>

                <h3 style={{ ...styles.cardTitle, ...styles.channelCardTitle, ...(isDark ? styles.darkTitle : {}) }}>Répartition par Canal</h3>



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

                <ChannelDistribution

                  data={channelStats}

                  selectedChannel={channelFilter}

                  onSelect={(label) =>

                    setChannelFilter(channelFilter === label ? "Tous" : label)

                  }

                  isDark={isDark}

                  compact={isCompactDashboard}

                  mobile={isMobileDashboard}

                />

              ) : (

                <p style={styles.emptyText}>Aucune donnée canal.</p>

              )}

            </div>



            <div

              style={{

                ...styles.chartCard,

                ...styles.feedbackChartCard,

                ...styles.urgencyChartCard,

                ...(isCompactDashboard ? styles.chartCardCompact : {}),

                ...(isDark ? styles.darkCard : {}),

              }}

            >

              <div style={styles.chartTitleRow}>

                <h3 style={{ ...styles.cardTitle, ...(isDark ? styles.darkTitle : {}) }}>Répartition par niveau d'urgence</h3>

              </div>

              <UrgencyChart data={urgencyStats} isDark={isDark} />

            </div>



            <div

              style={{

                ...styles.chartCard,

                ...styles.feedbackChartCard,

                ...(isCompactDashboard ? styles.chartCardCompact : {}),

                ...(isDark ? styles.darkCard : {}),

              }}

            >

              <div style={styles.chartTitleRow}>

                <h3 style={{ ...styles.cardTitle, ...(isDark ? styles.darkTitle : {}) }}>Feedbacks positifs</h3>

              </div>



              <FeedbackChart data={feedbackStats} />

            </div>

          </div>

          <div style={{ ...styles.maeMapSection, ...(isDark ? styles.darkCard : {}) }}>

            <div style={styles.maeMapHeader}>

              <div>

                <h3 style={{ ...styles.cardTitle, ...(isDark ? styles.darkTitle : {}) }}>Réseau MAE en Tunisie</h3>

                <p style={{ ...styles.mapSubtitle, ...(isDark ? styles.darkMutedText : {}) }}>

                  Agences et succursales MAE avec coordonnées de contact.

                </p>

              </div>



              <span style={styles.mapBadge}>{MAE_AGENCIES.length} agences</span>

            </div>



            <div style={styles.maeNetworkGrid}>

              <div style={{ ...styles.agencyStatsBox, ...(isDark ? styles.darkAgencyStatsBox : {}) }}>

                <div style={styles.agencyChartWrap}>

                  <div style={styles.agencyTotalCircle}>

                    <strong>{MAE_AGENCIES.length}</strong>

                    <span>Agences</span>

                  </div>



                  <ResponsiveContainer width="100%" height={230}>

                    <PieChart>

                      <Pie

                        data={MAE_REGION_STATS}

                        dataKey="count"

                        nameKey="region"

                        innerRadius={62}

                        outerRadius={92}

                        paddingAngle={4}

                      >

                        {MAE_REGION_STATS.map((item) => (

                          <Cell key={item.region} fill={item.color} />

                        ))}

                      </Pie>

                      <Tooltip formatter={(value) => [`${value} agence(s)`, ""]} />

                    </PieChart>

                  </ResponsiveContainer>

                </div>



                <div style={styles.agencyLegend}>

                  {MAE_REGION_STATS.map((item) => (

                    <span key={item.region} style={isDark ? styles.darkAgencyLegendItem : undefined}>

                      <i style={{ background: item.color }}></i>

                      {item.region} ({item.count})

                    </span>

                  ))}

                </div>

              </div>



              <div style={{ ...styles.mapBoxLarge, ...(isDark ? styles.darkMapBoxLarge : {}) }}>

                <AgenciesMap agencies={MAE_AGENCIES} isDark={isDark} />

              </div>



              <div style={{ ...styles.mapStatsPanel, ...(isDark ? styles.darkMapStatsPanel : {}) }}>

                <div style={styles.mapKpiGrid}>

                  <div style={{ ...styles.mapKpiBox, ...(isDark ? styles.darkMapKpiBox : {}) }}>

                    <strong style={styles.mapKpiValue}>{MAE_AGENCIES.length}</strong>

                    <span style={styles.mapKpiLabel}>Agences</span>

                  </div>



                  <div style={{ ...styles.mapKpiBox, ...(isDark ? styles.darkMapKpiBox : {}) }}>

                    <strong style={styles.mapKpiValue}>{governorateCount}</strong>

                    <span style={styles.mapKpiLabel}>Gouvernorats</span>

                  </div>



                  <div style={{ ...styles.mapKpiBox, ...(isDark ? styles.darkMapKpiBox : {}) }}>

                    <strong style={styles.mapKpiValue}>{maxAgencyRegion.count}</strong>

                    <span style={styles.mapKpiLabel}>Max région</span>

                  </div>

                </div>



                <div style={styles.regionBars}>

                  {MAE_REGION_STATS.map((item) => (

                    <div key={item.region} style={styles.regionBarItem}>

                      <div style={{ ...styles.regionBarTop, ...(isDark ? styles.darkRegionBarTop : {}) }}>

                        <span>{item.region}</span>

                        <b>{item.count}</b>

                      </div>



                      <div style={{ ...styles.regionBarTrack, ...(isDark ? styles.darkRegionBarTrack : {}) }}>

                        <div

                          style={{

                            ...styles.regionBarFill,

                            background: `linear-gradient(90deg, ${item.color}, #22c55e)`,

                            width: `${(item.count / maxAgencyRegion.count) * 100}%`,

                          }}

                        />

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>



          <AgencyDirectory

            agencies={filteredMaeAgencies}

            search={agencySearch}

            onSearchChange={setAgencySearch}

            regionFilter={agencyRegionFilter}

            onRegionChange={setAgencyRegionFilter}

            regionOptions={agencyRegions}

            isDark={isDark}

          />

          {/* après maeMapSection */}

          {user?.role === "ADMIN" && (

            <div style={styles.extraChartsGrid}>

              <div style={{ ...styles.chartCard, ...(isDark ? styles.darkCard : {}) }}>

                <h3 style={{ ...styles.cardTitle, ...(isDark ? styles.darkTitle : {}) }}>Évolution des réclamations</h3>



                <EvolutionChart data={complaints} styles={styles} />

              </div>



              <div style={{ ...styles.chartCard, ...(isDark ? styles.darkCard : {}) }}>

                <h3 style={{ ...styles.cardTitle, ...(isDark ? styles.darkTitle : {}) }}>Temps de traitement</h3>



                <ProcessingTimeChart data={complaints} />

              </div>

            </div>

          )}

          <div style={styles.extraChartsGrid}>



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

          <div style={{ ...styles.card, ...(isDark ? styles.darkCard : {}) }}>

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

                  <FiChevronLeft />

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

                  <FiChevronRight />

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

  const { theme } = useContext(ThemeContext);

  const isDark = theme === "dark";



  if (!data) return <PageLoader />;



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

  const needleColor = isDark ? "#f8fafc" : "#0f172a";

  const needleCenterColor = isDark ? "#f8fafc" : "#0f172a";

  const needleInnerColor = isDark ? "#0f172a" : "#ffffff";



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

          stroke={needleColor}

          strokeWidth="7"

          strokeLinecap="round"

        />



        <circle cx={cx} cy={cy} r="16" fill={needleCenterColor} />

        <circle cx={cx} cy={cy} r="6" fill={needleInnerColor} />



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

        <span>{data.good_feedbacks} positifs</span>

        <span>{data.reclamations} réclamations</span>

        <span>{badPercent}% réclamations</span>

      </div>

    </div>

  );

}

function AdminCategoryPie({ data, selectedCategory, compact = false, onSelect }) {

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

            cy={compact ? "46%" : "50%"}

            outerRadius={compact ? 78 : 95}

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



function AgentCategoryGauge({ data, user, isDark }) {

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

        <h2 style={{ ...styles.semiPercent, ...(isDark ? styles.semiPercentDark : {}) }}>
          {percent}%
        </h2>

        <p style={styles.semiLabel}>{activeItem.label}</p>

        <span style={{ ...styles.semiValue, ...(isDark ? styles.semiValueDark : {}) }}>

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



function CompactFilter({ label, value, onChange, options, isOpen, onToggle, onClose }) {

  const { theme } = useContext(ThemeContext);

  const isDark = theme === "dark";



  return (

    <div data-dashboard-filter-layer="true" style={styles.customFilter}>

      <span style={{ ...styles.compactLabel, ...(isDark ? styles.darkMutedText : {}) }}>{label}</span>



      <button

        type="button"

        style={{ ...styles.customSelectButton, ...(isDark ? styles.darkControl : {}) }}

        onClick={onToggle}

      >

        <span>{formatStatus(value)}</span>

        <FiChevronDown />

      </button>



      {isOpen && (

        <div style={{ ...styles.customSelectMenu, ...(isDark ? styles.darkDropdown : {}) }}>

          {options.map((option) => (

            <button

              key={option}

              type="button"

              style={{

                ...styles.customSelectOption,

                ...(isDark ? styles.darkDropdownOption : {}),

                ...(value === option ? styles.customSelectOptionActive : {}),

              }}

              onClick={() => {

                onChange(option);

                onClose();

              }}

            >

              {formatStatus(option)}

            </button>

          ))}

        </div>

      )}

    </div>

  );

}



function StatCard({ title, value, color, icon, active, onClick }) {

  const { theme } = useContext(ThemeContext);

  const isDark = theme === "dark";



  return (

    <div

      onClick={onClick}

      style={{

        ...styles.statCard,

        ...(isDark ? styles.darkStatCard : {}),

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

          {icon}

        </div>



        <div>

          <p style={{ ...styles.statTitle, ...(isDark ? styles.darkMutedText : {}) }}>{title}</p>

          <h2 style={{ ...styles.statValue, ...(isDark ? styles.darkTitle : {}) }}>{value}</h2>

        </div>

      </div>



      <div style={{ ...styles.progressTrack, ...(isDark ? styles.darkProgressTrack : {}) }}>

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

function ChannelDonut({

  data,

  selectedChannel,

  hoveredChannel,

  onHover,

  onSelect,

  isDark,

}) {

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const activeLabel = selectedChannel !== "Tous" ? selectedChannel : hoveredChannel;

  return (

    <div style={styles.channelDonutLayout}>

      <div style={styles.channelDonutBox}>

        <ResponsiveContainer width="100%" height={170}>

          <PieChart>

            <Pie

              data={data}

              dataKey="value"

              nameKey="label"

              innerRadius={50}

              outerRadius={78}

              paddingAngle={4}

              startAngle={90}

              endAngle={-270}

              onMouseLeave={() => onHover(null)}

            >

              {data.map((entry) => {

                const isActive =

                  selectedChannel === "Tous" || selectedChannel === entry.label;

                return (

                  <Cell

                    key={entry.label}

                    fill={getChannelColor(entry.label)}

                    opacity={isActive ? 1 : 0.32}

                    style={{ cursor: "pointer", outline: "none" }}

                    onClick={() => onSelect(entry.label)}

                    onMouseEnter={() => onHover(entry.label)}

                  />

                );

              })}

            </Pie>

            <Tooltip formatter={(value, name) => [`${value} réclamation(s)`, name]} />

          </PieChart>

        </ResponsiveContainer>

        <div style={styles.channelDonutCenter}>

          <strong style={{ ...styles.channelDonutTotal, ...(isDark ? styles.darkTitle : {}) }}>{total}</strong>

          <span style={{ ...styles.channelDonutLabel, ...(isDark ? styles.darkMutedText : {}) }}>Total</span>

        </div>

      </div>

      <div style={styles.channelLegendList}>

        {data.map((item) => {

          const isActive =

            selectedChannel === "Tous" || selectedChannel === item.label;

          const isFocused = activeLabel === item.label;

          return (

            <button

              key={item.label}

              type="button"

              style={{

                ...styles.channelLegendButton,

                ...(isDark ? styles.darkButtonControl : {}),

                opacity: isActive ? 1 : 0.55,

                transform: isFocused ? "translateX(4px)" : "translateX(0)",

              }}

              onClick={() => onSelect(item.label)}

              onMouseEnter={() => onHover(item.label)}

              onMouseLeave={() => onHover(null)}

            >

              <span

                style={{

                  ...styles.channelLegendDot,

                  background: getChannelColor(item.label),

                }}

              />

              <span style={{ ...styles.channelLegendName, ...(isDark ? styles.darkTitle : {}) }}>{item.label}</span>

              <strong style={{ ...styles.channelLegendValue, ...(isDark ? styles.darkTitle : {}) }}>{item.value}</strong>

              <span style={{ ...styles.channelLegendPercent, ...(isDark ? styles.darkMutedText : {}) }}>{item.percent}</span>

            </button>

          );

        })}

      </div>

    </div>

  );

}

function ChannelDistribution({ data, selectedChannel, onSelect, isDark, compact, mobile }) {

  return (

    <div style={styles.channelDistribution}>

      <div style={styles.channelDistributionRows}>

        {data.map((item) => {

          const isActive = selectedChannel === "Tous" || selectedChannel === item.label;

          return (

            <button

              key={item.label}

              type="button"

              style={{

                ...styles.channelDistributionRow,

                ...(compact ? styles.channelDistributionRowCompact : {}),

                ...(mobile ? styles.channelDistributionRowMobile : {}),

                opacity: isActive ? 1 : 0.55,

              }}

              onClick={() => onSelect(item.label)}

            >
              <span style={getChannelBadgeStyle(item.label, mobile)}>{item.label}</span>

              <span style={{ ...styles.channelDistributionTrack, ...(mobile ? styles.channelDistributionTrackMobile : {}), ...(isDark ? styles.darkChannelTrack : {}) }}>

                <span

                  style={{

                    ...styles.channelDistributionFill,

                    width: item.width,

                  }}

                />

              </span>

              <strong style={{ ...styles.channelDistributionValue, ...(isDark ? styles.darkTitle : {}) }}>{item.value}</strong>

              <span style={{ ...styles.channelDistributionPercent, ...(isDark ? styles.darkMutedText : {}) }}>{item.percent}</span>

            </button>

          );

        })}

      </div>

    </div>

  );

}

function UrgencyChart({ data, isDark }) {

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length || total === 0) {

    return <p style={styles.emptyText}>Aucune donnée urgence.</p>;

  }

  const urgencyOrder = ["elevee", "moyenne", "faible"];

  const chartData = urgencyOrder
    .map((key) => data.find((item) => item.key === key))
    .filter(Boolean)
    .map((item) => ({
      ...item,
      percentValue: Math.round((item.value / total) * 100),
    }));

  const mainColor = "#166534";

  return (

    <div style={styles.urgencyCurvePanel}>

      <div style={styles.urgencyCurveSummary}>

        {chartData.map((item) => (

          <div key={item.key} style={{ ...styles.urgencyCurveMetric, ...(isDark ? styles.darkButtonControl : {}) }}>

            <span style={{ ...styles.urgencyCurveDot, background: item.color }} />

            <span style={{ ...styles.urgencyCurveLabel, ...(isDark ? styles.darkMutedText : {}) }}>{item.label}</span>

            <strong style={{ ...styles.urgencyCurveValue, ...(isDark ? styles.darkTitle : {}) }}>{item.value}</strong>

            <span style={{ ...styles.urgencyCurvePercent, color: item.color }}>{item.percentValue}%</span>

          </div>

        ))}

      </div>

      <div style={styles.urgencyCurveChart}>

        <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={chartData} margin={{ top: 18, right: 18, left: -18, bottom: 6 }}>

            <defs>

              <linearGradient id="urgencyCurveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={mainColor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={mainColor} stopOpacity={0.02} />
              </linearGradient>

            </defs>

            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={isDark ? "#334155" : "#dbe7df"} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDark ? "#cbd5e1" : "#64748b", fontSize: 12, fontWeight: 800 }}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDark ? "#cbd5e1" : "#94a3b8", fontSize: 11, fontWeight: 700 }}
            />

            <Tooltip
              formatter={(value, name, props) => [
                `${value} réclamation(s) - ${props.payload.percentValue}%`,
                "Urgence",
              ]}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid #bbf7d0",
                boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
                fontWeight: 800,
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={mainColor}
              strokeWidth={4}
              fill="url(#urgencyCurveGradient)"
              activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 3 }}
              dot={(props) => {
                const { cx, cy, payload } = props;

                return (
                  <circle
                    key={payload.key}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={payload.color}
                    stroke="#ffffff"
                    strokeWidth={3}
                  />
                );
              }}
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}



function parseDate(dateString) {

  if (!dateString) return null;



  // format: 28/04/2026 09:02:20

  if (dateString.includes("/")) {

    const [datePart, timePart = "00:00:00"] = dateString.split(" ");

    const [day, month, year] = datePart.split("/");



    const parsed = new Date(`${year}-${month}-${day}T${timePart}`);

    return Number.isNaN(parsed.getTime()) ? null : parsed;

  }



  const date = new Date(dateString);

  return Number.isNaN(date.getTime()) ? null : date;

}

function formatLocalDate(date) {

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

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

function formatUrgencyLabel(urgency) {

  if (urgency === "elevee") return "Élevée";

  if (urgency === "moyenne") return "Moyenne";

  if (urgency === "faible") return "Faible";

  return urgency || "-";

}

function escapeHtml(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;");

}

function buildExportTableHtml(rows, stats, pdfMode = false) {

  const tableRows = rows

    .map(

      (row) => {
        const statusClass = getExportStatusClass(row.statut);
        const urgencyClass = getExportUrgencyClass(row.urgence);

        return `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.client)}</td>
          <td>${escapeHtml(row.canal)}</td>
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.categorie)}</td>
          <td><span class="badge ${statusClass}">${escapeHtml(row.statut)}</span></td>
          <td><span class="badge ${urgencyClass}">${escapeHtml(row.urgence)}</span></td>
          <td>${escapeHtml(row.reclamation)}</td>
        </tr>`;
      }

    )

    .join("");

  return `
    <main class="report">
    <section class="report-header">
      <div>
        <p class="report-kicker">Export PDF / Excel</p>
        <h1>Rapport des réclamations</h1>
      </div>
      <div class="report-date">Généré le ${escapeHtml(new Date().toLocaleDateString("fr-FR"))}</div>
    </section>
    <div class="stats">
      <div class="stat"><span>Total</span><strong>${escapeHtml(stats.total)}</strong></div>
      <div class="stat"><span>En cours</span><strong>${escapeHtml(stats.enCours)}</strong></div>
      <div class="stat"><span>Traitées</span><strong>${escapeHtml(stats.traitees)}</strong></div>
      <div class="stat"><span>En attente</span><strong>${escapeHtml(stats.enAttente)}</strong></div>
    </div>
    <div class="table-wrap">
    <table ${pdfMode ? "" : 'border="1"'}>
      <colgroup>
        <col class="col-id" />
        <col class="col-client" />
        <col class="col-canal" />
        <col class="col-date" />
        <col class="col-category" />
        <col class="col-status" />
        <col class="col-urgency" />
        <col class="col-complaint" />
      </colgroup>
      <thead>
        <tr>
          <th>ID</th>
          <th>Client</th>
          <th>Canal</th>
          <th>Date</th>
          <th>Catégorie</th>
          <th>Statut</th>
          <th>Urgence</th>
          <th>Réclamation</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    </div>
    </main>`;

}

function getExportStatusClass(status) {

  if (status === "Traitée") return "status-done";

  if (status === "En cours") return "status-progress";

  if (status === "En attente") return "status-waiting";

  return "";

}

function getExportUrgencyClass(urgency) {

  if (urgency === "Faible") return "urgency-low";

  if (urgency === "Moyenne") return "urgency-medium";

  if (urgency === "Élevée") return "urgency-high";

  return "";

}

function getTodayStamp() {

  return new Date().toISOString().slice(0, 10);

}

function downloadFile(filename, content, type) {

  const blob = new Blob([content], { type });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);

}



function getChannelBadgeStyle(label, compact = false) {

  return {

    display: "inline-block",

    width: compact ? "128px" : "150px",

    textAlign: "center",

    padding: compact ? "9px 12px" : "10px 14px",

    borderRadius: "13px",

    color: "#fff",

    fontWeight: "900",

    fontSize: compact ? "15px" : "17px",

    lineHeight: 1,

    background:

      label === "Facebook"

        ? "linear-gradient(135deg, #2563eb, #60a5fa)"

        : "linear-gradient(135deg, #1d4ed8, #38bdf8)",

    boxShadow: "0 14px 26px rgba(37, 99, 235, 0.2)",

    boxSizing: "border-box",

    transition: "all 0.25s ease",

  };

}

function getChannelColor(label) {

  if (label === "Facebook") return "#2563eb";

  if (label === "LinkedIn") return "#0ea5e9";

  return "#64748b";

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

const maeMarkerIcon = L.divIcon({

  className: "mae-marker",

  html: `<div class="mae-marker-pin"><span></span></div>`,

  iconSize: [28, 28],

  iconAnchor: [14, 28],

  popupAnchor: [0, -28],

});

function AgenciesMap({ agencies, isDark = false }) {

  const agencyBounds = agencies.map((agency) => [agency.lat, agency.lng]);



  return (

    <MapContainer

      bounds={agencyBounds}

      boundsOptions={{ padding: [24, 24] }}

      scrollWheelZoom={false}

      style={{ height: "100%", width: "100%" }}

    >

      <TileLayer

        attribution="&copy; OpenStreetMap &copy; CARTO"

        url={`https://{s}.basemaps.cartocdn.com/${isDark ? "dark_all" : "light_all"}/{z}/{x}/{y}{r}.png`}

      />



      {agencies.map((agency) => (

        <Marker

          key={agency.id}

          position={[agency.lat, agency.lng]}

          icon={maeMarkerIcon}

        >

          <Popup>

            <div style={styles.agencyPopup}>

              <strong>{agency.name}</strong>

              <span>{agency.address}</span>

              <span>{agency.governorate} - {agency.region}</span>

              <div style={styles.popupPhones}>

                {agency.phones.map((phone) => (

                  <span key={phone}>{phone}</span>

                ))}

              </div>

              <small>{agency.email}</small>

            </div>

          </Popup>

        </Marker>

      ))}

    </MapContainer>

  );

}



function AgencyDirectory({

  agencies,

  search,

  onSearchChange,

  regionFilter,

  onRegionChange,

  regionOptions,

  isDark,

}) {

  return (

    <div style={{ ...styles.agencyDirectoryCard, ...(isDark ? styles.darkCard : {}) }}>

      <div style={styles.agencyDirectoryHeader}>

        <div>

          <h3 style={{ ...styles.cardTitle, ...(isDark ? styles.darkTitle : {}) }}>

            Annuaire des agences MAE

          </h3>

          <p style={{ ...styles.mapSubtitle, ...(isDark ? styles.darkMutedText : {}) }}>

            Rechercher une agence et consulter directement ses numéros.

          </p>

        </div>



        <span style={styles.mapBadge}>{agencies.length} résultat(s)</span>

      </div>



      <div style={styles.agencyDirectoryFilters}>

        <input

          type="text"

          value={search}

          onChange={(event) => onSearchChange(event.target.value)}

          placeholder="Rechercher par agence, ville, adresse ou téléphone..."

          style={{ ...styles.agencySearchInput, ...(isDark ? styles.darkControl : {}) }}

        />

        <select

          value={regionFilter}

          onChange={(event) => onRegionChange(event.target.value)}

          style={{ ...styles.agencyRegionSelect, ...(isDark ? styles.darkControl : {}) }}

        >

          {regionOptions.map((region) => (

            <option key={region} value={region}>

              {region}

            </option>

          ))}

        </select>

      </div>



      <div style={styles.agencyDirectoryList}>

        {agencies.map((agency) => (

          <div key={agency.id} style={{ ...styles.agencyDirectoryItem, ...(isDark ? styles.darkAgencyDirectoryItem : {}) }}>

            <div>

              <div style={{ ...styles.agencyDirectoryName, ...(isDark ? styles.darkText : {}) }}>

                {agency.name}

              </div>

              <div style={{ ...styles.agencyDirectoryAddress, ...(isDark ? styles.darkMutedText : {}) }}>

                {agency.address}

              </div>

              <div style={styles.agencyDirectoryMeta}>

                <span

                  style={{

                    ...styles.agencyDirectoryDot,

                    background: MAE_REGION_COLORS[agency.region] || "#166534",

                  }}

                ></span>

                {agency.governorate} - {agency.region}

              </div>

            </div>



            <div style={styles.agencyPhoneGroup}>

              {agency.phones.map((phone) => (

                <a key={phone} href={`tel:${phone}`} style={styles.agencyPhoneChip}>

                  {phone}

                </a>

              ))}

            </div>

          </div>

        ))}



        {!agencies.length && (

          <p style={{ ...styles.emptyText, ...(isDark ? styles.darkMutedText : {}) }}>

            Aucune agence ne correspond à votre recherche.

          </p>

        )}

      </div>

    </div>

  );

}



function EvolutionChart({ data, styles }) {

  const evolutionData = useMemo(() => {

    const counts = {};

    const now = new Date();



    const last30Days = new Date();

    last30Days.setDate(now.getDate() - 30);



    data.forEach((item) => {

      const date = parseDate(item.comment_date);

      if (!date) return;

      if (date < last30Days) return;



      const label = date.toISOString().split("T")[0];

      counts[label] = (counts[label] || 0) + 1;

    });



    const evolutionData = Object.entries(counts)

      .map(([date, value]) => ({ date, value }))

      .sort((a, b) => new Date(a.date) - new Date(b.date));



    return evolutionData;

  }, [data]);



  if (!evolutionData.length) {

    return (

      <div style={styles.emptyChartBox}>

        <span>
          <FiBarChart2 />
        </span>

        <p>Aucune réclamation enregistrée durant les 30 derniers jours.</p>

      </div>

    );

  }



  const total = evolutionData.reduce((sum, item) => sum + item.value, 0);

  const average = total / evolutionData.length;

  const maxPoint = evolutionData.reduce(

    (max, item) => (item.value > max.value ? item : max),

    evolutionData[0]

  );

  const isHighPeak = maxPoint.value >= 5; // tu peux ajuster le seuil

  return (

    <div>

      <div style={styles.evolutionSummary}>

        <div style={styles.evolutionKpi}>

          <strong>{total}</strong>

          <span>Total 30 jours</span>

        </div>



        <div style={styles.evolutionKpi}>

          <strong>{average.toFixed(1)}</strong>

          <span>Moyenne / jour</span>

        </div>



        <div style={styles.evolutionKpiHighlight}>

          <strong>{maxPoint.value}</strong>

          <span>

            Pic le{" "}

            {new Date(maxPoint.date).toLocaleDateString("fr-FR", {

              day: "2-digit",

              month: "2-digit",

            })}

          </span>

        </div>

      </div>



      <div style={{ width: "100%", height: 280 }}>

        <ResponsiveContainer>

          <LineChart data={evolutionData}>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />



            <XAxis

              dataKey="date"

              tickFormatter={(date) =>

                new Date(date).toLocaleDateString("fr-FR", {

                  day: "2-digit",

                  month: "2-digit",

                })

              }

            />



            <YAxis allowDecimals={false} />



            <Tooltip

              labelFormatter={(date) =>

                new Date(date).toLocaleDateString("fr-FR", {

                  day: "2-digit",

                  month: "long",

                  year: "numeric",

                })

              }

              formatter={(value) => [`${value} réclamation(s)`, "Nombre"]}

            />



            <Line

              type="monotone"

              dataKey="value"

              stroke="#166534"

              strokeWidth={4}

              dot={(props) => {

                const { cx, cy, payload } = props;

                const isMax = payload.date === maxPoint.date;



                return (

                  <circle

                    cx={cx}

                    cy={cy}

                    r={isMax ? 7 : 4}

                    fill={isMax ? "#e97667" : "#166534"}

                    stroke="#ffffff"

                    strokeWidth={2}

                  />

                );

              }}

              activeDot={{ r: 8 }}

            />

          </LineChart>

        </ResponsiveContainer>

      </div>



      {isHighPeak && (

        <div style={styles.alertBox}>

          Pic élevé détecté : {maxPoint.value} réclamation(s) le{" "}

          {new Date(maxPoint.date).toLocaleDateString("fr-FR", {

            day: "2-digit",

            month: "long",

            year: "numeric",

          })}

        </div>

      )}



      <div style={styles.evolutionInsight}>

        <FiTrendingUp /> Le pic des 30 derniers jours est de{" "}

        <strong>{maxPoint.value} réclamation(s)</strong> enregistré le{" "}

        <strong>

          {new Date(maxPoint.date).toLocaleDateString("fr-FR", {

            day: "2-digit",

            month: "long",

          })}

        </strong>

        .

      </div>

    </div>

  );

}







function ProcessingTimeChart({ data }) {

  const chartData = useMemo(() => {

    const buckets = {

      "<1j": 0,

      "1-3j": 0,

      "3-7j": 0,

      ">7j": 0,

    };



    data.forEach((item) => {

      const created = new Date(item.opened_at);

      const processed = new Date(item.processed_at);

      if (!created || !processed) return;



      const diffDays = Math.floor(

        (processed - created) / (1000 * 60 * 60 * 24)

      );



      if (diffDays < 1) buckets["<1j"]++;

      else if (diffDays <= 3) buckets["1-3j"]++;

      else if (diffDays <= 7) buckets["3-7j"]++;

      else buckets[">7j"]++;

    });

    console.log(

      "TRAITEE ITEM =",

      JSON.stringify(data.find((item) => item.status === "TRAITEE"), null, 2)

    );

    return Object.entries(buckets).map(([name, value]) => ({

      name,

      value,

    }));

  }, [data]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);



  if (total === 0) {

    return (

      <div style={styles.emptyChartBox}>

        <span>
          <FiBarChart2 />
        </span>

        <p>Aucune réclamation traitée pour calculer le temps de traitement.</p>

      </div>

    );

  } return (

    <div style={{ width: "100%", height: 320, minHeight: 320 }}>

      <ResponsiveContainer width="100%" height="100%">

        <BarChart data={chartData}>

          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

          <XAxis dataKey="name" />

          <YAxis allowDecimals={false} />

          <Tooltip cursor={{ fill: "transparent" }} />

          <Bar dataKey="value" fill="#166534" radius={[8, 8, 0, 0]} />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

const styles = {

  page: {

    display: "flex",

    flexDirection: "column",

    gap: "16px",

    padding: "4px",

    background:

      "linear-gradient(135deg, #f8fafc 0%, #f0fdf4 38%, #ffffff 100%)",

    borderRadius: "18px",

  },

  dashboardHero: {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    gap: "14px",

    flexWrap: "wrap",

    padding: "10px 16px",

    borderRadius: "14px",

    background:

      "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(220, 252, 231, 0.9))",

    border: "1px solid rgba(22, 101, 52, 0.14)",

    boxShadow: "0 8px 20px rgba(22, 101, 52, 0.08)",

  },

  dashboardEyebrow: {

    display: "inline-block",

    color: "#166534",

    fontSize: "12px",

    fontWeight: "900",

    letterSpacing: "0",

    textTransform: "uppercase",

    marginBottom: "8px",

  },

  dashboardTitle: {

    margin: 0,

    color: "#111827",

    fontSize: "18px",

    fontWeight: "850",

    lineHeight: 1.2,

  },

  dashboardSubtitle: {

    margin: "10px 0 0",

    color: "#166534",

    fontSize: "14px",

    fontWeight: "700",

  },

  dashboardHeroStats: {

    display: "flex",

    gap: "8px",

    flexWrap: "wrap",

    justifyContent: "flex-end",

  },

  dashboardHeroChip: {

    border: "1px solid rgba(22, 101, 52, 0.18)",

    background: "rgba(255, 255, 255, 0.72)",

    color: "#166534",

    borderRadius: "999px",

    padding: "10px 14px",

    fontSize: "13px",

    fontWeight: "900",

  },

  exportActions: {

    display: "flex",

    alignItems: "center",

    justifyContent: "flex-end",

    gap: "10px",

    flexWrap: "wrap",

  },

  exportButton: {

    height: "34px",

    borderRadius: "10px",

    border: "1px solid #bbf7d0",

    background: "#ffffff",

    color: "#166534",

    padding: "0 12px",

    display: "inline-flex",

    alignItems: "center",

    gap: "7px",

    fontWeight: "900",

    cursor: "pointer",

  },

  exportButtonPrimary: {

    height: "34px",

    borderRadius: "10px",

    border: "1px solid #166534",

    background: "#166534",

    color: "#ffffff",

    padding: "0 12px",

    display: "inline-flex",

    alignItems: "center",

    gap: "7px",

    fontWeight: "900",

    cursor: "pointer",

  },




  filtersBar: {

    position: "relative",

    zIndex: 7000,

    background: "rgba(255, 255, 255, 0.86)",

    borderRadius: "18px",

    padding: "14px",

    border: "1px solid rgba(22, 101, 52, 0.12)",

    boxShadow: "0 14px 34px rgba(22, 101, 52, 0.07)",

    backdropFilter: "blur(10px)",

  },

  filtersBarCalendarOpen: {

    position: "relative",

    zIndex: 5000,

    overflow: "visible",

  },



  filtersAll: {

    position: "relative",

    zIndex: 7001,

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

  evolutionSummary: {

    display: "grid",

    gridTemplateColumns: "repeat(3, 1fr)",

    gap: "12px",

    marginBottom: "16px",

  },



  evolutionKpi: {

    background: "#f8fafc",

    border: "1px solid #bbf7d0",

    borderRadius: "16px",

    padding: "12px",

    textAlign: "center",

  },



  evolutionKpiHighlight: {

    background: "#f0fdf4",

    border: "1px solid #bbf7d0",

    borderRadius: "16px",

    padding: "12px",

    textAlign: "center",

    color: "#166534",

  },



  evolutionInsight: {

    marginTop: "12px",

    padding: "12px 14px",

    borderRadius: "14px",

    background: "#f0fdf4",

    border: "1px solid #bbf7d0",

    color: "#166534",

    fontSize: "13px",

    fontWeight: "700",

  },

  smallChartCard: {

    background: "#ffffff",

    borderRadius: "24px",

    padding: "22px",

    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",

    minHeight: "auto",

    height: "fit-content",

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

    background: "#f0fdf4",

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

    fontWeight: "800",

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

    border: "1px solid #bbf7d0",

    background: "#f0fdf4",

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

  resetButtonPro: {

    display: "flex",

    alignItems: "center",

    gap: "8px",

    height: "42px",

    padding: "0 16px",

    borderRadius: "14px",

    border: "1px solid #86efac",

    background: "#f0fdf4",

    color: "#166534",

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

    background: "rgba(255, 255, 255, 0.94)",

    borderRadius: "18px",

    padding: "18px",

    boxShadow: "0 14px 34px rgba(22, 101, 52, 0.07)",

    display: "flex",

    flexDirection: "column",

    gap: "12px",

    cursor: "pointer",

    border: "1px solid rgba(22, 101, 52, 0.12)",

    transition: "all 0.25s ease",

  },



  statCardActive: {

    border: "1px solid #166534",

    boxShadow: "0 22px 44px rgba(22, 101, 52, 0.14)",

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

    width: "50px",

    height: "50px",

    borderRadius: "18px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: "20px",

    fontWeight: "700",

  },



  statTitle: {

    margin: 0,

    color: "#64748b",

    fontSize: "13px",

    fontWeight: "800",

  },



  statValue: {

    margin: "6px 0 0 0",

    fontSize: "32px",

    color: "#111827",

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

    gridTemplateColumns: "minmax(520px, 1.25fr) minmax(420px, 0.75fr)",

    gridAutoRows: "minmax(180px, auto)",

    gap: "20px",

    alignItems: "stretch",

  },



  chartCard: {

    background: "rgba(255, 255, 255, 0.95)",

    borderRadius: "24px",

    padding: "24px",

    border: "1px solid rgba(22, 101, 52, 0.12)",

    boxShadow: "0 20px 44px rgba(22, 101, 52, 0.08)",

    minHeight: "0",

    overflow: "visible",

  },

  chartCardCompact: {

    gridColumn: "1",

    gridRow: "auto",

  },



  categoryChartCard: {

    gridColumn: "1",

    minHeight: "430px",

    display: "flex",

    flexDirection: "column",

  },



  channelChartCard: {

    gridColumn: "1",

    alignSelf: "start",

    height: "fit-content",

    minHeight: "0",

    padding: "24px 28px 30px",

    borderRadius: "22px",

  },

  urgencyChartCard: {

    gridColumn: "2",

    gridRow: "1",

    minHeight: "220px",

  },



  feedbackChartCard: {

    gridColumn: "2",

    minHeight: "260px",

  },



  chartTitleRow: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: "16px",

  },



  cardTitle: {

    margin: 0,

    fontSize: "17px",

    color: "#111827",

    fontWeight: "900",

  },

  channelCardTitle: {

    fontSize: "21px",

  },



  pieChartBox: {

    width: "100%",

    height: "330px",

  },



  clearChartFilter: {

    border: "1px solid #86efac",

    background: "#ecfdf5",

    color: "#166534",

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

  semiPercentDark: {

    color: "#f8fafc",

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

  semiValueDark: {

    color: "#cbd5e1",

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

    gap: "14px",

    marginBottom: "10px",

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

  chartsGridCompact: {

    gridTemplateColumns: "minmax(0, 1fr)",

  },

  statsGridCompact: {

    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  },

  statsGridMobile: {

    gridTemplateColumns: "1fr",

  },

  filtersAllCompact: {

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    alignItems: "end",

  },

  filtersAllMobile: {

    gridTemplateColumns: "1fr",

  },

  channelDistribution: {

    display: "grid",

    gap: "0",

  },

  channelDistributionHeader: {

    display: "flex",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: "16px",

  },

  channelDistributionEyebrow: {

    display: "block",

    color: "#166534",

    fontSize: "12px",

    fontWeight: "800",

    marginBottom: "4px",

  },

  channelDistributionTotal: {

    color: "#0f172a",

    fontSize: "34px",

    fontWeight: "900",

    lineHeight: 1,

  },

  channelDistributionBadge: {

    border: "1px solid #bbf7d0",

    background: "#ecfdf5",

    color: "#166534",

    borderRadius: "999px",

    padding: "7px 11px",

    fontSize: "12px",

    fontWeight: "800",

  },

  channelStackTrack: {

    display: "flex",

    height: "16px",

    background: "#fce7f3",

    borderRadius: "999px",

    overflow: "hidden",

  },

  channelStackSegment: {

    height: "100%",

    border: "0",

    padding: 0,

    cursor: "pointer",

    transition: "opacity 0.2s ease",

  },

  channelDistributionRows: {

    display: "grid",

    gap: "16px",

  },

  channelDistributionRow: {

    width: "100%",

    border: "0",

    background: "transparent",

    borderRadius: "0",

    padding: "0",

    display: "grid",

    gridTemplateColumns: "150px minmax(160px, 1fr) 38px 54px",

    alignItems: "center",

    gap: "18px",

    cursor: "pointer",

    textAlign: "left",

    transition: "all 0.2s ease",

  },

  channelDistributionRowCompact: {

    gridTemplateColumns: "minmax(120px, 150px) minmax(120px, 1fr) 34px 48px",

    gap: "12px",

  },

  channelDistributionRowMobile: {

    gridTemplateColumns: "1fr auto auto",

    gap: "10px",

  },

  channelDistributionDot: {

    width: "10px",

    height: "10px",

    borderRadius: "50%",

  },

  channelDistributionName: {

    color: "#0f172a",

    fontSize: "13px",

    fontWeight: "800",

  },

  channelDistributionTrack: {

    width: "100%",

    height: "22px",

    background: "#edf3fc",

    borderRadius: "999px",

    overflow: "hidden",

    display: "block",

  },

  channelDistributionTrackMobile: {

    gridColumn: "1 / -1",

    gridRow: "2",

  },

  channelDistributionFill: {

    height: "100%",

    minWidth: "14px",

    borderRadius: "999px",

    background: "linear-gradient(90deg, #2768e8 0%, #55a7f5 100%)",

    display: "block",

    transition: "width 0.25s ease",

  },

  channelDistributionValue: {

    color: "#162238",

    fontSize: "18px",

    fontWeight: "900",

    textAlign: "right",

  },

  channelDistributionPercent: {

    color: "#7084a3",

    fontSize: "18px",

    fontWeight: "900",

    minWidth: "42px",

    textAlign: "right",

  },

  channelDonutLayout: {

    display: "grid",

    gridTemplateColumns: "190px 1fr",

    alignItems: "center",

    gap: "18px",

  },

  channelDonutBox: {

    position: "relative",

    height: "170px",

  },

  channelDonutCenter: {

    position: "absolute",

    inset: 0,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    pointerEvents: "none",

  },

  channelDonutTotal: {

    color: "#0f172a",

    fontSize: "30px",

    fontWeight: "900",

    lineHeight: 1,

  },

  channelDonutLabel: {

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "800",

    marginTop: "4px",

  },

  channelLegendList: {

    display: "grid",

    gap: "10px",

  },

  channelLegendButton: {

    width: "100%",

    border: "1px solid #d8f3df",

    background: "#f0fdf4",

    borderRadius: "14px",

    padding: "10px 12px",

    display: "grid",

    gridTemplateColumns: "12px 1fr auto auto",

    alignItems: "center",

    gap: "10px",

    cursor: "pointer",

    transition: "all 0.2s ease",

  },

  channelLegendDot: {

    width: "10px",

    height: "10px",

    borderRadius: "50%",

  },

  channelLegendName: {

    color: "#0f172a",

    fontSize: "13px",

    fontWeight: "800",

    textAlign: "left",

  },

  channelLegendValue: {

    color: "#0f172a",

    fontSize: "14px",

    fontWeight: "900",

  },

  channelLegendPercent: {

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "800",

    minWidth: "34px",

    textAlign: "right",

  },

  urgencyList: {

    display: "grid",

    gap: "14px",

  },

  urgencyPanel: {

    display: "grid",

    gap: "16px",

  },

  urgencyCurvePanel: {

    display: "grid",

    gap: "18px",

  },

  urgencyCurveSummary: {

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "10px",

  },

  urgencyCurveMetric: {

    minWidth: 0,

    border: "1px solid #d8f3df",

    background: "#f8fafc",

    borderRadius: "16px",

    padding: "12px",

    display: "grid",

    gridTemplateColumns: "10px 1fr",

    alignItems: "center",

    columnGap: "8px",

    rowGap: "4px",

  },

  urgencyCurveDot: {

    width: "10px",

    height: "10px",

    borderRadius: "50%",

  },

  urgencyCurveLabel: {

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "900",

  },

  urgencyCurveValue: {

    gridColumn: "1 / -1",

    color: "#0f172a",

    fontSize: "28px",

    lineHeight: 1,

    fontWeight: "900",

  },

  urgencyCurvePercent: {

    gridColumn: "1 / -1",

    fontSize: "12px",

    fontWeight: "900",

  },

  urgencyCurveChart: {

    height: "245px",

  },

  urgency3dPanel: {

    minHeight: "390px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",

  },

  urgency3dSvg: {

    width: "100%",

    maxWidth: "720px",

    height: "390px",

    display: "block",

  },

  urgency3dLabel: {

    fill: "#475569",

    fontSize: "26px",

    fontWeight: "500",

  },

  urgency3dValue: {

    fontSize: "28px",

    fontWeight: "800",

  },

  urgencyProHeader: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    paddingBottom: "14px",

    borderBottom: "1px solid #e5e7eb",

  },

  urgencyProEyebrow: {

    display: "block",

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "900",

    textTransform: "uppercase",

  },

  urgencyProTotal: {

    display: "block",

    marginTop: "6px",

    color: "#0f172a",

    fontSize: "34px",

    lineHeight: 1,

    fontWeight: "900",

  },

  urgencyRiskBadge: {

    minWidth: "132px",

    border: "1px solid #fecaca",

    background: "#fff7ed",

    borderRadius: "16px",

    padding: "12px 14px",

    textAlign: "right",

  },

  urgencyRiskValue: {

    display: "block",

    color: "#dc2626",

    fontSize: "22px",

    fontWeight: "900",

    lineHeight: 1,

  },

  urgencyRiskLabel: {

    display: "block",

    marginTop: "5px",

    color: "#64748b",

    fontSize: "11px",

    fontWeight: "900",

    textTransform: "uppercase",

  },

  urgencyProRows: {

    display: "grid",

    gap: "16px",

  },

  urgencyProRow: {

    display: "grid",

    gap: "9px",

  },

  urgencyProRowTop: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "14px",

  },

  urgencyProTrack: {

    height: "9px",

    background: "#edf2f7",

    borderRadius: "999px",

    overflow: "hidden",

  },

  urgencyProFill: {

    height: "100%",

    borderRadius: "999px",

  },

  urgencyOverview: {

    display: "grid",

    gridTemplateColumns: "1.1fr 1fr",

    gap: "14px",

  },

  urgencyMainMetric: {

    minHeight: "126px",

    borderRadius: "20px",

    padding: "18px",

    background: "linear-gradient(135deg, #fff7ed, #fef2f2)",

    border: "1px solid #fed7aa",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

  },

  urgencyMetricLabel: {

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "900",

    textTransform: "uppercase",

  },

  urgencyMetricValue: {

    color: "#0f172a",

    fontSize: "44px",

    fontWeight: "900",

    lineHeight: 1,

    margin: "10px 0",

  },

  urgencyMetricChip: {

    width: "390px",

    borderRadius: "999px",

    padding: "6px 10px",

    background: "#ffffff",

    color: "#e97667",

    fontSize: "12px",

    fontWeight: "900",

    border: "1px solid #fecaca",

  },

  urgencyMiniGrid: {

    display: "grid",

    gap: "12px",

  },

  urgencyMiniCard: {

    border: "1px solid #d8f3df",

    background: "#f8fafc",

    borderRadius: "18px",

    padding: "14px",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

  },

  urgencyMiniLabel: {

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "900",

  },

  urgencyMiniValue: {

    color: "#0f172a",

    fontSize: "24px",

    fontWeight: "900",

  },

  urgencyStack: {

    display: "flex",

    height: "16px",

    overflow: "hidden",

    borderRadius: "999px",

    background: "#e5e7eb",

  },

  urgencyStackSegment: {

    height: "100%",

  },

  urgencyRowsPro: {

    display: "grid",

    gap: "10px",

  },

  urgencyRowPro: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "14px",

    padding: "12px 14px",

    border: "1px solid #e5e7eb",

    background: "#ffffff",

    borderRadius: "16px",

  },

  urgencyRowLeft: {

    display: "flex",

    alignItems: "center",

    gap: "10px",

  },

  urgencyDot: {

    width: "10px",

    height: "10px",

    borderRadius: "50%",

  },

  urgencyRowLabel: {

    color: "#0f172a",

    fontSize: "13px",

    fontWeight: "900",

  },

  urgencyRowRight: {

    display: "flex",

    alignItems: "baseline",

    gap: "10px",

  },

  urgencyRowValue: {

    color: "#0f172a",

    fontSize: "15px",

    fontWeight: "900",

  },

  urgencyRowPercent: {

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "900",

    minWidth: "34px",

    textAlign: "right",

  },

  urgencyRow: {

    display: "grid",

    gridTemplateColumns: "1fr auto",

    alignItems: "center",

    columnGap: "14px",

    rowGap: "8px",

  },

  urgencyHeader: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "12px",

  },

  urgencyPill: {

    borderRadius: "999px",

    padding: "7px 12px",

    fontSize: "12px",

    fontWeight: "800",

  },

  urgencyValue: {

    color: "#0f172a",

    fontSize: "16px",

  },

  urgencyTrack: {

    gridColumn: "1",

    height: "10px",

    background: "#e5e7eb",

    borderRadius: "999px",

    overflow: "hidden",

  },

  urgencyFill: {

    height: "100%",

    borderRadius: "999px",

    transition: "width 0.25s ease",

  },

  urgencyPercent: {

    gridColumn: "2",

    gridRow: "1 / span 2",

    color: "#64748b",

    fontSize: "13px",

    fontWeight: "800",

  },

  maeMapSection: {

    background: "rgba(255, 255, 255, 0.95)",

    borderRadius: "18px",

    padding: "18px",

    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.07)",

  },



  maeMapHeader: {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: "20px",

  },



  mapSubtitle: {

    margin: "6px 0 0",

    color: "#64748b",

    fontSize: "13px",

    fontWeight: "600",

  },



  mapBadge: {

    background: "#dcfce7",

    color: "#166534",

    padding: "8px 16px",

    borderRadius: "999px",

    fontWeight: "800",

  },

  darkTitle: {

    color: "#f8fafc",

  },

  maeMapContent: {

    display: "grid",

    gridTemplateColumns: "1.7fr 0.8fr",

    gap: "22px",

  },



  maeNetworkGrid: {

    display: "grid",

    gridTemplateColumns: "0.8fr 1.25fr 0.95fr",

    gap: "22px",

    alignItems: "stretch",

  },



  mapBoxLarge: {

    height: "430px",

    borderRadius: "24px",

    overflow: "hidden",

    border: "1px solid #dcfce7",

    boxShadow: "inset 0 0 0 1px rgba(22,101,52,0.08)",

  },

  darkMapBoxLarge: {

    border: "1px solid #27563c",

    boxShadow: "0 18px 35px rgba(0, 0, 0, 0.22)",

    background: "#0f172a",

  },







  mapStatBig: {

    textAlign: "center",

    color: "#166534",

  },



  mapStatBigStrong: {

    fontSize: "54px",

    display: "block",

  },



  regionList: {

    display: "flex",

    flexDirection: "column",

    gap: "12px",

    color: "#334155",

    fontWeight: "700",

  },

  channelTrack: {

    flex: 1,

    height: "14px",

    background: "#eef3fb",

    borderRadius: "999px",

    overflow: "hidden",

  },



  channelFill: {

    height: "100%",

    borderRadius: "999px",

    transition: "all 0.25s ease",

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

  extraChartsGrid: {

    display: "grid",

    gridTemplateColumns: "1fr 1fr",

    gap: "18px",

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













  channelValue: {

    color: "#24324a",

    fontWeight: "700",

    minWidth: "36px",

  },

  emptyChartBox: {

    height: "260px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "10px",

    color: "#64748b",

    fontWeight: "700",

    background: "#f8fafc",

    borderRadius: "18px",

    border: "1px dashed #cbd5e1",

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

  dateRangeWrapperCompact: {

    minWidth: 0,

    width: "100%",

  },

  dateRangeWrapperCalendarOpen: {

    zIndex: 5001,

  },



  dateRangeButton: {

    height: "42px",

    borderRadius: "14px",

    border: "1px solid #bbf7d0",

    background: "#f0fdf4",

    padding: "0 14px",

    color: "#1e293b",

    fontSize: "14px",

    fontWeight: "700",

    cursor: "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "10px",

    width: "100%",

  },



  calendarDropdown: {

    position: "absolute",

    top: "64px",

    left: 0,

    zIndex: 5002,

    width: "390px",

    boxSizing: "border-box",

    background: "#ffffff",

    borderRadius: "22px",

    padding: "12px",

    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",

    border: "1px solid #e2e8f0",

  },

  calendarDropdownCompact: {

    boxSizing: "border-box",

  },

  calendarDropdownMobile: {

    position: "static",

    width: "100%",

    marginTop: "8px",

    padding: "10px",

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

    background: "linear-gradient(135deg, #166534, #3f8d69)",

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

  customFilter: {

    position: "relative",

    zIndex: 7002,

    display: "flex",

    flexDirection: "column",

    gap: "6px",

    minWidth: "190px",

  },

  darkCard: {

    background: "#0f172a",

    border: "1px solid #1e293b",

    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",

  },

  darkControl: {

    background: "#111827",

    border: "1px solid #334155",

    color: "#f8fafc",

    boxShadow: "none",

  },

  darkDropdown: {

    background: "#111827",

    border: "1px solid #334155",

    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",

  },

  darkDropdownOption: {

    color: "#e2e8f0",

  },

  darkSearchWrap: {

    background: "#111827",

    border: "1px solid #334155",

  },

  darkSearchInput: {

    color: "#f8fafc",

  },

  darkButtonControl: {

    background: "#111827",

    border: "1px solid #334155",

    color: "#e2e8f0",

  },

  darkChannelTrack: {

    background: "#1e293b",

  },

  darkCalendarWrapper: {

    background: "#111827",

  },

  darkStatCard: {

    background: "#111827",

    border: "1px solid #1f2937",

    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.32)",

  },

  darkProgressTrack: {

    background: "#1f2937",

  },

  customSelectButton: {

    height: "46px",

    borderRadius: "16px",

    border: "1px solid #bbf7d0",

    background: "#f0fdf4",

    padding: "0 14px",

    color: "#0f172a",

    fontSize: "14px",

    fontWeight: "800",

    cursor: "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    boxShadow: "0 6px 14px rgba(15, 23, 42, 0.04)",

  },



  customSelectMenu: {

    position: "absolute",

    top: "72px",

    left: 0,

    minWidth: "100%",

    width: "max-content",

    maxWidth: "260px",

    zIndex: 7003,

    background: "#ffffff",

    border: "1px solid #e2e8f0",

    borderRadius: "18px",

    padding: "8px",

    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",

  },



  customSelectOption: {

    width: "100%",

    border: "none",

    background: "transparent",

    padding: "11px 12px",

    borderRadius: "12px",

    textAlign: "left",

    whiteSpace: "nowrap",

    lineHeight: 1.2,

    cursor: "pointer",

    fontSize: "14px",

    fontWeight: "700",

    color: "#334155",

  },

  agencyTotalCircle: {

    position: "absolute",

    top: "50%",

    left: "50%",

    transform: "translate(-50%, -50%)",

    textAlign: "center",

    zIndex: 2,

    color: "#166534",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    gap: "2px",

    pointerEvents: "none",

  },



  agencyLegend: {

    display: "flex",

    flexDirection: "column",

    gap: "8px",

    fontSize: "13px",

    fontWeight: "700",

    color: "#334155",

    width: "100%",

    maxWidth: "320px",

    margin: "0 auto",

  },

  darkAgencyLegendItem: {

    color: "#dbeafe",

  },



  customSelectOptionActive: {

    background: "#ecfdf5",

    color: "#166534",

  },

  tabButton: {

    padding: "8px 16px",

    borderRadius: "999px",

    border: "1px solid #d8f3df",

    background: "rgba(255, 255, 255, 0.9)",

    color: "#475569",

    fontSize: "14px",

    fontWeight: "800",

    cursor: "pointer",

  },

  mapBoxPro: {

    height: "390px",

    borderRadius: "24px",

    overflow: "hidden",

    border: "1px solid #dcfce7",

    boxShadow: "inset 0 0 0 1px rgba(22,101,52,0.08)",

  },

  activeTab: {

    background: "#ecfdf5",

    color: "#166534",

    border: "1px solid #86efac",

  },



  card: {

    background: "rgba(255, 255, 255, 0.95)",

    borderRadius: "18px",

    padding: "18px",

    border: "1px solid rgba(22, 101, 52, 0.12)",

    boxShadow: "0 14px 34px rgba(22, 101, 52, 0.07)",

    overflow: "visible",

    height: "100%",

    minHeight: "350px"

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

    borderRadius: "18px",

    padding: "18px",

    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.07)",

  },







  maeMapSection: {

    background: "#ffffff",

    borderRadius: "18px",

    padding: "18px",

    marginTop: "16px",

    boxShadow: "0 14px 34px rgba(22, 101, 52, 0.07)",

    border: "1px solid rgba(22, 101, 52, 0.12)",

  },



  maeMapHeader: {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: "20px",

  },



  mapSubtitle: {

    margin: "6px 0 0",

    color: "#64748b",

    fontSize: "13px",

    fontWeight: "600",

  },



  mapBadge: {

    background: "#ecfdf5",

    color: "#166534",

    padding: "8px 16px",

    borderRadius: "999px",

    fontWeight: "800",

  },



  maeMapContent: {

    display: "grid",

    gridTemplateColumns: "1.7fr 0.8fr",

    gap: "22px",

  },



  mapBoxLarge: {

    height: "430px",

    borderRadius: "24px",

    overflow: "hidden",

    border: "1px solid #bbf7d0",

  },



  mapStatBig: {

    textAlign: "center",

    color: "#166534",

  },



  mapStatBigStrong: {

    fontSize: "54px",

    display: "block",

  },



  regionList: {

    display: "flex",

    flexDirection: "column",

    gap: "12px",

    color: "#334155",

    fontWeight: "700",

  },





  maeMapHeader: {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: "20px",

  },



  mapSubtitle: {

    margin: "6px 0 0",

    color: "#64748b",

    fontSize: "13px",

    fontWeight: "600",

  },



  mapBadge: {

    background: "#ecfdf5",

    color: "#166534",

    padding: "8px 16px",

    borderRadius: "999px",

    fontWeight: "800",

  },



  maeMapContent: {

    display: "grid",

    gridTemplateColumns: "1.7fr 0.8fr",

    gap: "22px",

  },



  mapBoxLarge: {

    height: "430px",

    borderRadius: "24px",

    overflow: "hidden",

    border: "1px solid #bbf7d0",

  },

  mapKpiGrid: {

    display: "grid",

    gridTemplateColumns: "repeat(3, 1fr)",

    gap: "12px",

  },



  mapKpiBox: {

    background: "#ffffff",

    border: "1px solid #dcfce7",

    borderRadius: "16px",

    padding: "14px",

    textAlign: "center",

  },

  darkMapKpiBox: {

    background: "#111827",

    border: "1px solid #27563c",

  },



  mapKpiValue: {

    fontSize: "22px",

    fontWeight: "900",

    color: "#166534",

    display: "block",

  },



  mapKpiLabel: {

    fontSize: "12px",

    color: "#64748b",

    fontWeight: "600",

  },



  regionBars: {

    display: "flex",

    flexDirection: "column",

    gap: "12px",

    marginTop: "18px",

  },



  regionBarItem: {

    display: "flex",

    flexDirection: "column",

    gap: "6px",

  },



  regionBarTop: {

    display: "flex",

    justifyContent: "space-between",

    fontSize: "13px",

    fontWeight: "700",

    color: "#334155",

  },

  darkRegionBarTop: {

    color: "#e5e7eb",

  },



  regionBarTrack: {

    height: "8px",

    background: "#e5e7eb",

    borderRadius: "999px",

    overflow: "hidden",

  },

  darkRegionBarTrack: {

    background: "#1f2937",

  },



  regionBarFill: {

    height: "100%",

    background: "linear-gradient(90deg, #166534, #22c55e)",

    borderRadius: "999px",

  },

  mapStatsPanel: {

    background: "linear-gradient(135deg, #f0fdf4, #ffffff)",

    border: "1px solid #dcfce7",

    borderRadius: "24px",

    padding: "22px",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "20px",

  },

  darkMapStatsPanel: {

    background: "linear-gradient(135deg, #0f172a, #111827)",

    border: "1px solid #234634",

    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",

  },



  agencyPopup: {

    display: "flex",

    flexDirection: "column",

    gap: "6px",

    minWidth: "220px",

    color: "#0f172a",

  },



  popupPhones: {

    display: "flex",

    flexWrap: "wrap",

    gap: "6px",

  },



  agencyDirectoryCard: {

    background: "#ffffff",

    borderRadius: "18px",

    padding: "18px",

    marginTop: "16px",

    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.07)",

    border: "1px solid #e2e8f0",

  },



  agencyDirectoryHeader: {

    display: "flex",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: "16px",

    marginBottom: "18px",

  },



  agencyDirectoryFilters: {

    display: "grid",

    gridTemplateColumns: "1fr 260px",

    gap: "12px",

    marginBottom: "18px",

  },



  agencySearchInput: {

    height: "44px",

    borderRadius: "14px",

    border: "1px solid #dbe3ef",

    background: "#f8fafc",

    padding: "0 14px",

    color: "#0f172a",

    fontWeight: "700",

    outline: "none",

  },



  agencyRegionSelect: {

    height: "44px",

    borderRadius: "14px",

    border: "1px solid #dbe3ef",

    background: "#f8fafc",

    padding: "0 14px",

    color: "#0f172a",

    fontWeight: "800",

    outline: "none",

  },



  agencyDirectoryList: {

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "12px",

    maxHeight: "520px",

    overflowY: "auto",

    paddingRight: "6px",

  },



  agencyDirectoryItem: {

    minHeight: "136px",

    border: "1px solid #e2e8f0",

    borderRadius: "16px",

    background: "#f8fafc",

    padding: "14px",

    display: "flex",

    flexDirection: "column",

    justifyContent: "space-between",

    gap: "12px",

  },



  darkAgencyDirectoryItem: {

    background: "#111827",

    border: "1px solid #334155",

  },



  agencyDirectoryName: {

    color: "#0f172a",

    fontSize: "15px",

    fontWeight: "900",

  },



  agencyDirectoryAddress: {

    color: "#64748b",

    fontSize: "13px",

    lineHeight: 1.45,

    marginTop: "5px",

  },



  agencyDirectoryMeta: {

    display: "flex",

    alignItems: "center",

    gap: "7px",

    color: "#64748b",

    fontSize: "12px",

    fontWeight: "800",

    marginTop: "8px",

  },



  agencyDirectoryDot: {

    width: "9px",

    height: "9px",

    borderRadius: "50%",

    flexShrink: 0,

  },



  agencyPhoneGroup: {

    display: "flex",

    flexWrap: "wrap",

    gap: "7px",

  },



  agencyPhoneChip: {

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "7px 10px",

    borderRadius: "999px",

    background: "#dcfce7",

    color: "#166534",

    fontSize: "12px",

    fontWeight: "900",

    textDecoration: "none",

  },



  mapStatBig: {

    textAlign: "center",

    color: "#166534",

  },



  mapStatBigStrong: {

    fontSize: "54px",

    display: "block",

  },



  regionList: {

    display: "flex",

    flexDirection: "column",

    gap: "12px",

    color: "#334155",

    fontWeight: "700",

  },



  calendarWrapper: {

    background: "#fff",

    borderRadius: "20px",

    padding: "12px",

    width: "100%",

    boxSizing: "border-box",

  },



  dateInputs: {

    display: "flex",

    gap: "10px",

    marginBottom: "10px",

  },



  dateInput: {

    flex: 1,

    padding: "10px",

    borderRadius: "10px",

    border: "1px solid #e2e8f0",

    fontSize: "14px",

  },

  darkText: {

    color: "#f8fafc",

  },



  darkMutedText: {

    color: "#cbd5e1",

  },



  darkTableText: {

    color: "#e5e7eb",

  },



  darkTableRow: {

    color: "#e5e7eb",

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

    minHeight: "250px",

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

    marginTop: "10px",

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

  mapCard: {

    background: "#ffffff",

    borderRadius: "28px",

    padding: "26px",

    boxShadow: "0 16px 38px rgba(15, 23, 42, 0.07)",

  },

  agencyMapGrid: {

    display: "grid",

    gridTemplateColumns: "0.9fr 1.4fr",

    gap: "22px",

    alignItems: "stretch",

  },

  mapBox: {

    height: "360px",

    width: "100%",

    borderRadius: "20px",

    overflow: "hidden",

    border: "1px solid #e2e8f0",

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

  agencyStatsBox: {

    borderRadius: "24px",

    background: "linear-gradient(135deg, #f0fdf4, #ffffff)",

    border: "1px solid #dcfce7",

    padding: "20px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "16px",

  },

  darkAgencyStatsBox: {

    background: "linear-gradient(135deg, #0f172a, #111827)",

    border: "1px solid #234634",

    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",

  },

  agencyChartWrap: {

    width: "100%",

    maxWidth: "320px",

    height: "230px",

    position: "relative",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    margin: "0 auto",

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

  alertBox: {

    marginTop: "10px",

    padding: "12px 14px",

    background: "#fef2f2",

    border: "1px solid #fecaca",

    borderRadius: "14px",

    color: "#b91c1c",

    fontSize: "13px",

    fontWeight: "800",

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







