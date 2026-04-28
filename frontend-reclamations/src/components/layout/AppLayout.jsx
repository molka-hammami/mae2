import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div style={styles.layout}>
      <Sidebar />

      <div style={styles.mainArea}>
        <Header />

        <main style={styles.content}>
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
  },
};

export default AppLayout;