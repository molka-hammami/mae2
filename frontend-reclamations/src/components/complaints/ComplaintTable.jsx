import { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";

function getStatusStyle(status) {
  const base = {
    padding: "7px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "12px",
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "EN_ATTENTE":
      return { ...base, backgroundColor: "#fee2e2", color: "#dc2626" };
    case "EN_COURS":
      return { ...base, backgroundColor: "#fef3c7", color: "#d97706" };
    case "TRAITEE":
    case "TRAITÉE":
      return { ...base, backgroundColor: "#dcfce7", color: "#16a34a" };
    default:
      return { ...base, backgroundColor: "#e5e7eb", color: "#374151" };
  }
}

function getUrgencyStyle(urgency) {
  const base = {
    padding: "7px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "12px",
    whiteSpace: "nowrap",
  };

  switch (urgency) {
    case "elevee":
      return { ...base, backgroundColor: "#fee2e2", color: "#dc2626" };
    case "moyenne":
      return { ...base, backgroundColor: "#fef3c7", color: "#d97706" };
    case "faible":
      return { ...base, backgroundColor: "#dcfce7", color: "#16a34a" };
    default:
      return { ...base, backgroundColor: "#e5e7eb", color: "#374151" };
  }
}

function formatStatus(status) {
  switch (status) {
    case "EN_ATTENTE":
      return "En attente";
    case "EN_COURS":
      return "En cours";
    case "TRAITEE":
    case "TRAITÉE":
      return "Traitée";
    default:
      return status || "-";
  }
}

function formatUrgency(urgency) {
  switch (urgency) {
    case "elevee":
      return "Élevée";
    case "moyenne":
      return "Moyenne";
    case "faible":
      return "Faible";
    default:
      return urgency || "-";
  }
}

function ComplaintTable({ data }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p style={{ ...styles.empty, ...(isDark ? styles.darkText : {}) }}>
        Aucune réclamation disponible.
      </p>
    );
  }

  return (
    <div style={{ ...styles.tableViewport, ...(isDark ? styles.tableViewportDark : {}) }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {[
              "ID",
              "Réclamation",
              "Catégorie",
              "Canal",
              "Date",
              "Statut",
              "Urgence",
              "Actions",
            ].map((title) => (
              <th key={title} style={{ ...styles.th, ...(isDark ? styles.thDark : {}) }}>
                {title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td style={{ ...styles.tdId, ...(isDark ? styles.tdDark : {}) }}>
                #{String(item.comment_id ?? item.id).padStart(4, "0")}
              </td>

              <td style={{ ...styles.tdText, ...(isDark ? styles.tdDark : {}) }}>
                <div style={{ ...styles.textClamp, ...(isDark ? styles.darkText : {}) }}>
                  {item.text_original || "-"}
                </div>
              </td>

              <td style={{ ...styles.td, ...(isDark ? styles.tdDark : {}) }}>
                <span style={item.category ? styles.categoryBadge : styles.categoryBadgeNoClass}>
                  {item.category ? item.category : "NON CLASSÉE"}
                </span>
              </td>

              <td style={{ ...styles.td, ...(isDark ? styles.tdDark : {}) }}>
                <span style={styles.channelBadge}>{item.source || "-"}</span>
              </td>

              <td style={{ ...styles.td, ...(isDark ? styles.tdDark : {}) }}>
                {item.comment_date || "-"}
              </td>

              <td style={{ ...styles.td, ...(isDark ? styles.tdDark : {}) }}>
                <span style={getStatusStyle(item.status)}>{formatStatus(item.status)}</span>
              </td>

              <td style={{ ...styles.td, ...(isDark ? styles.tdDark : {}) }}>
                <span style={getUrgencyStyle(item.urgency)}>{formatUrgency(item.urgency)}</span>
              </td>

              <td style={{ ...styles.td, ...(isDark ? styles.tdDark : {}) }}>
                <Link
                  to={`/complaints/${item.id}`}
                  style={{ ...styles.viewButton, ...(isDark ? styles.viewButtonDark : {}) }}
                >
                  Voir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableViewport: {
    overflow: "auto",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 250px)",
    position: "relative",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
  },
  tableViewportDark: {
    border: "1px solid #334155",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: "1100px",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    textAlign: "left",
    padding: "14px 12px",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    boxShadow: "0 1px 0 #e2e8f0",
  },
  thDark: {
    backgroundColor: "#111827",
    color: "#e5e7eb",
    borderBottom: "1px solid #334155",
    boxShadow: "0 1px 0 #334155",
  },
  td: {
    padding: "14px 12px",
    verticalAlign: "middle",
    borderBottom: "1px solid #eef2f7",
    color: "#1e293b",
    fontSize: "14px",
  },
  tdId: {
    padding: "14px 12px",
    borderBottom: "1px solid #eef2f7",
    color: "#334155",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  tdText: {
    padding: "14px 12px",
    borderBottom: "1px solid #eef2f7",
    maxWidth: "320px",
  },
  tdDark: {
    color: "#e5e7eb",
    borderBottom: "1px solid #334155",
  },
  textClamp: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    fontSize: "13px",
    color: "#334155",
  },
  darkText: {
    color: "#e5e7eb",
  },
  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#edf1f5",
    color: "#334155",
    fontWeight: "800",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  categoryBadgeNoClass: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#edf1f5",
    color: "#dc2626",
    fontWeight: "800",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  channelBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#3b76d2",
    color: "#fff",
    fontWeight: "800",
    fontSize: "12px",
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },
  viewButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 14px",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    border: "1px solid #d7dee8",
    textDecoration: "none",
    fontWeight: "800",
    color: "#1e3a5f",
  },
  viewButtonDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
  },
  empty: {
    color: "#64748b",
    margin: 0,
    padding: "18px",
    borderRadius: "14px",
    background: "#f8fafc",
    fontWeight: "700",
  },
};

export default ComplaintTable;
