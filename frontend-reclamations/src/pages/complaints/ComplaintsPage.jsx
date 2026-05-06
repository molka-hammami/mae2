import { useContext, useEffect, useMemo, useState } from "react";
import ComplaintTable from "../../components/complaints/ComplaintTable";
import { fetchComplaints } from "../../api/complaintsApi";
import { ThemeContext } from "../../context/ThemeContext";

function ComplaintsPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(complaints.length / itemsPerPage));

  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return complaints.slice(start, end);
  }, [complaints, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return (
      <p style={{ ...styles.message, ...(isDark ? styles.darkMutedText : {}) }}>
        Chargement des réclamations...
      </p>
    );
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
          Consultez et suivez toutes les réclamations détectées.
        </p>
      </div>

      <div style={{ ...styles.card, ...(isDark ? styles.darkCard : {}) }}>
        <div style={styles.topBar}>
          <div
            style={{
              ...styles.countBlock,
              ...(isDark ? styles.darkMutedText : {}),
            }}
          >
            Total :{" "}
            <span style={{ ...styles.countValue, ...(isDark ? styles.darkText : {}) }}>
              {complaints.length}
            </span>
          </div>

          <div style={styles.paginationBlock}>
            <span
              style={{
                ...styles.pageText,
                ...(isDark ? styles.darkMutedText : {}),
              }}
            >
              Page {currentPage} of {totalPages}
            </span>

            <div style={styles.paginationButtons}>
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                style={{
                  ...styles.pageButton,
                  ...(isDark ? styles.pageButtonDark : {}),
                  ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
                }}
              >
                ‹
              </button>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.pageButton,
                  ...(isDark ? styles.pageButtonDark : {}),
                  ...(currentPage === totalPages ? styles.pageButtonDisabled : {}),
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <ComplaintTable data={paginatedComplaints} />
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

  headerBlock: {
    marginBottom: "4px",
  },

  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: "700",
    color: "#1e293b",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#64748b",
    fontSize: "17px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    overflowX: "auto",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  countBlock: {
    color: "#475569",
    fontSize: "15px",
    fontWeight: "600",
  },

  countValue: {
    color: "#1e293b",
    fontWeight: "800",
  },

  paginationBlock: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  pageText: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },

  paginationButtons: {
    display: "flex",
    gap: "8px",
  },

  pageButton: {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    border: "1px solid #dbe4ee",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer",
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

  message: {
    fontSize: "16px",
    color: "#334155",
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

  darkTitle: {
    color: "#f8fafc",
  },

  darkText: {
    color: "#f8fafc",
  },

  darkMutedText: {
    color: "#cbd5e1",
  },
};

export default ComplaintsPage;