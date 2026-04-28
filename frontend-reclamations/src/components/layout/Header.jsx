import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goTo = (path) => {
    setOpenMenu(false);
    navigate(path);
  };

  return (
    <header style={styles.header}>
      <h2 style={styles.title}>Tableau de bord</h2>

      <div style={styles.userMenuWrapper}>
        <div style={styles.userMenu} onClick={() => setOpenMenu(!openMenu)}>
          {localStorage.getItem("avatar") ? (
  <img
    src={localStorage.getItem("avatar")}
    alt="avatar"
    style={styles.avatarImage}
  />
) : (
  <div style={styles.avatar}>
    {user?.name?.charAt(0)?.toUpperCase() || "U"}
  </div>
)}

          <div>
            <p style={styles.userName}>{user?.name}</p>
            <span style={styles.userRole}>{user?.role}</span>
          </div>
        </div>

        {openMenu && (
          <div style={styles.dropdown}>
            <button style={styles.dropdownBtn} onClick={() => goTo("/profile")}>
              👤 Mon profil
            </button>

            <button
              style={styles.dropdownBtn}
              onClick={() => goTo("/change-password")}
            >
              🔐 Changer mot de passe
            </button>

            <button style={styles.dropdownBtnDanger} onClick={handleLogout}>
              🚪 Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: "78px",
    backgroundColor: "#ffffff",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    color: "#1e293b",
  },
  userMenuWrapper: {
    position: "relative",
  },
  userMenu: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "12px",
  },
  userName: {
    margin: 0,
    fontWeight: "600",
    color: "#1e293b",
  },
  userRole: {
    fontSize: "12px",
    color: "#64748b",
  },
  avatarImage: {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid #dcfce7",
},
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#166534",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },
  dropdown: {
    position: "absolute",
    top: "52px",
    right: 0,
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.15)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "220px",
    zIndex: 1000,
  },
  dropdownBtn: {
    padding: "11px 12px",
    border: "none",
    background: "#f8fafc",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "600",
    color: "#1e293b",
  },
  dropdownBtnDanger: {
    padding: "11px 12px",
    border: "none",
    background: "#fef2f2",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "600",
    color: "#dc2626",
  },
};

export default Header;