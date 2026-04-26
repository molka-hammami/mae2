import { Link } from "react-router-dom";

function ComplaintTable({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p style={styles.empty}>Aucune réclamation disponible.</p>;
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Réclamation</th>
          <th style={styles.th}>Catégorie</th>
          <th style={styles.th}>Canal</th>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Statut</th>
          <th style={styles.th}>Urgence</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td style={styles.tdId}>
              #{String(item.comment_id ?? item.id).padStart(4, "0")}
            </td>

            <td style={styles.tdText}>
              <div style={styles.textClamp}>
                {item.text_original || "-"}
              </div>
            </td>

            <td style={styles.td}>
              <span
                style={
                  item.category
                    ? styles.categoryBadge
                    : styles.categoryBadgeNoClass
                }
              >
                {item.category ? item.category : "NON CLASSÉE"}
              </span>
            </td>

            <td style={styles.td}>
              <span style={styles.channelBadge}>
                {item.source || "-"}
              </span>
            </td>

            <td style={styles.td}>{item.comment_date || "-"}</td>

            <td style={styles.td}>
              <span style={getStatusStyle(item.status)}>
                {formatStatus(item.status)}
              </span>
            </td>

            <td style={styles.td}>
              <span style={getUrgencyStyle(item.urgency)}>
                {formatUrgency(item.urgency)}
              </span>
            </td>

            <td style={styles.td}>
              <Link to={`/complaints/${item.id}`} style={styles.viewButton}>
                Voir
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatStatus(status) {
  if (!status) return "-";

  const map = {
    EN_COURS: "En cours",
    EN_ATTENTE: "En attente",
    TRAITEE: "Traitée",
    TRAITÉE: "Traitée",
  };

  return map[status] || status;
}

function formatUrgency(urgency) {
  if (!urgency) return "-";

  const map = {
    elevee: "Élevée",
    moyenne: "Moyenne",
    faible: "Faible",
  };

  return map[urgency] || urgency;
}

function getStatusStyle(status) {
  const base = {
    ...styles.pill,
    minWidth: "120px",
    textAlign: "center",
  };

  switch (status) {
    case "EN_COURS":
      return {
        ...base,
        backgroundColor: "#ecd78b",
        color: "#8a5a00",
      };
    case "EN_ATTENTE":
      return {
        ...base,
        backgroundColor: "#f3d6d3",
        color: "#d13f3f",
      };
    case "TRAITEE":
    case "TRAITÉE":
      return {
        ...base,
        backgroundColor: "#dff0df",
        color: "#15803d",
      };
    default:
      return {
        ...base,
        backgroundColor: "#e2e8f0",
        color: "#475569",
      };
  }
}

function getUrgencyStyle(urgency) {
  const base = {
    ...styles.pill,
    minWidth: "90px",
    textAlign: "center",
  };

  switch (urgency) {
    case "elevee":
      return {
        ...base,
        backgroundColor: "#f3d6d3",
        color: "#dc2626",
      };
    case "moyenne":
      return {
        ...base,
        backgroundColor: "#fdf0c7",
        color: "#b45309",
      };
    case "faible":
      return {
        ...base,
        backgroundColor: "#dff0df",
        color: "#15803d",
      };
    default:
      return {
        ...base,
        backgroundColor: "#e2e8f0",
        color: "#475569",
      };
  }
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: "1100px",
  },
  th: {
    textAlign: "left",
    padding: "16px 14px",
    fontSize: "15px",
    color: "#64748b",
    fontWeight: "700",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  td: {
    padding: "18px 14px",
    verticalAlign: "middle",
    borderBottom: "1px solid #eef2f7",
    color: "#1e293b",
    fontSize: "15px",
  },
  tdId: {
    padding: "18px 14px",
    borderBottom: "1px solid #eef2f7",
    color: "#334155",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  tdText: {
    padding: "18px 12px",
    borderBottom: "1px solid #eef2f7",
    maxWidth: "320px",
  },
  textClamp: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    fontSize: "13px",
    color: "#334155",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 18px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: "999px",
    backgroundColor: "#edf1f5",
    color: "#334155",
    fontWeight: "700",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  categoryBadgeNoClass: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: "999px",
    backgroundColor: "#edf1f5",
    color: "#dc2626",
    fontWeight: "700",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  channelBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 18px",
    borderRadius: "999px",
    backgroundColor: "#3b76d2",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    textTransform: "capitalize",
  },
  viewButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 18px",
    borderRadius: "999px",
    backgroundColor: "#f8fafc",
    border: "1px solid #d7dee8",
    textDecoration: "none",
    fontWeight: "700",
    color: "#1e3a5f",
  },
  empty: {
    color: "#64748b",
    margin: 0,
  },
};

export default ComplaintTable;