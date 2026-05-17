import { useContext, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
function AppLayout() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ ...styles.layout, ...(isDark ? styles.layoutDark : {}) }}>
      {!isMobile && <Sidebar />}

      <div style={styles.mainArea}>
        <Header />

        <main
          style={{
            ...styles.content,
            ...(isMobile ? styles.contentMobile : {}),
            ...(isDark ? styles.contentDark : {}),
          }}
        >
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
    minWidth: 0,
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

  contentMobile: {
    padding: "16px 12px",
  },

  contentDark: {
    background: "#0b1220",
  },
};

export default AppLayout;
