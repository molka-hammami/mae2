import { useContext } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
function AppLayout() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <div style={{ ...styles.layout, ...(isDark ? styles.layoutDark : {}) }}>
      <Sidebar />

      <div style={styles.mainArea}>
        <Header />

        <main style={{ ...styles.content, ...(isDark ? styles.contentDark : {}) }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#eef3f8",
  },

  layoutDark: {
    background: "#0b1220",
  },

  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },

  content: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    background: "#eef3f8",
  },

  contentDark: {
    background: "#0b1220",
  },
};

export default AppLayout;