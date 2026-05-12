import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

function SkeletonLoader({ type = "table", rows = 8 }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  if (type === "dashboard") {
    return (
      <div style={styles.dashboard}>
        <div style={{ ...styles.hero, ...(isDark ? styles.darkBlock : {}) }} />
        <div style={{ ...styles.filters, ...(isDark ? styles.darkBlock : {}) }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index} style={{ ...styles.pill, ...(isDark ? styles.darkLine : {}) }} />
          ))}
        </div>
        <div style={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} style={{ ...styles.card, ...(isDark ? styles.darkBlock : {}) }}>
              <span style={{ ...styles.lineShort, ...(isDark ? styles.darkLine : {}) }} />
              <span style={{ ...styles.lineLarge, ...(isDark ? styles.darkLine : {}) }} />
            </div>
          ))}
        </div>
        <div style={styles.chartGrid}>
          <div style={{ ...styles.chart, ...(isDark ? styles.darkBlock : {}) }} />
          <div style={{ ...styles.chart, ...(isDark ? styles.darkBlock : {}) }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.tableCard, ...(isDark ? styles.darkBlock : {}) }}>
      <div style={styles.tableTop}>
        <span style={{ ...styles.lineLarge, ...(isDark ? styles.darkLine : {}) }} />
        <span style={{ ...styles.pill, ...(isDark ? styles.darkLine : {}) }} />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={styles.tableRow}>
          <span style={{ ...styles.lineId, ...(isDark ? styles.darkLine : {}) }} />
          <span style={{ ...styles.lineText, ...(isDark ? styles.darkLine : {}) }} />
          <span style={{ ...styles.pillSmall, ...(isDark ? styles.darkLine : {}) }} />
          <span style={{ ...styles.pillSmall, ...(isDark ? styles.darkLine : {}) }} />
        </div>
      ))}
    </div>
  );
}

const pulse = {
  animation: "skeletonPulse 1.35s ease-in-out infinite",
};

const styles = {
  dashboard: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  hero: {
    height: "88px",
    borderRadius: "18px",
    background: "#ffffff",
    ...pulse,
  },
  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    padding: "16px",
    borderRadius: "18px",
    background: "#ffffff",
    ...pulse,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  card: {
    minHeight: "118px",
    borderRadius: "18px",
    background: "#ffffff",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    ...pulse,
  },
  chart: {
    minHeight: "300px",
    borderRadius: "18px",
    background: "#ffffff",
    ...pulse,
  },
  tableCard: {
    borderRadius: "18px",
    background: "#ffffff",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    ...pulse,
  },
  tableTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "80px minmax(180px, 1fr) 140px 120px",
    gap: "14px",
    alignItems: "center",
    minHeight: "44px",
  },
  lineId: {
    height: "16px",
    borderRadius: "999px",
    background: "#e2e8f0",
  },
  lineText: {
    height: "16px",
    borderRadius: "999px",
    background: "#e2e8f0",
  },
  lineShort: {
    width: "55%",
    height: "14px",
    borderRadius: "999px",
    background: "#e2e8f0",
  },
  lineLarge: {
    width: "78%",
    height: "22px",
    borderRadius: "999px",
    background: "#e2e8f0",
  },
  pill: {
    width: "170px",
    maxWidth: "100%",
    height: "42px",
    borderRadius: "14px",
    background: "#e2e8f0",
  },
  pillSmall: {
    height: "28px",
    borderRadius: "999px",
    background: "#e2e8f0",
  },
  darkBlock: {
    background: "#0f172a",
  },
  darkLine: {
    background: "#1e293b",
  },
};

export default SkeletonLoader;
