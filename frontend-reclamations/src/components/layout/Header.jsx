import { useContext, useEffect, useState } from "react";
import { FiChevronDown, FiLock, FiLogOut, FiMoon, FiSun, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";

function Header() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(false);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const loadAvatar = () => {
      if (!user?.id) return setAvatar("");
      setAvatar(localStorage.getItem(`avatar_${user.id}`) || "");
    };

    loadAvatar();
    window.addEventListener("avatarUpdated", loadAvatar);

    return () => window.removeEventListener("avatarUpdated", loadAvatar);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goTo = (path) => {
    setOpenMenu(false);
    navigate(path);
  };

  const isDark = theme === "dark";

  return (
    <header style={{ ...styles.header, ...(isDark ? styles.headerDark : {}) }}>
      <div>
        <h2 style={{ ...styles.title, ...(isDark ? styles.titleDark : {}) }}>
          Tableau de bord
        </h2>
        <p style={styles.subtitle}>Bienvenue dans votre espace de gestion</p>
      </div>

      <div style={styles.rightSide}>
        <button
          type="button"
          style={{ ...styles.themeButton, ...(isDark ? styles.themeButtonDark : {}) }}
          onClick={toggleTheme}
        >
          {isDark ? <FiSun /> : <FiMoon />}
          {isDark ? "Clair" : "Sombre"}
        </button>

        <div style={styles.userMenuWrapper}>
          <button
            type="button"
            style={{ ...styles.userMenu, ...(isDark ? styles.userMenuDark : {}) }}
            onClick={() => setOpenMenu(!openMenu)}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" style={styles.avatarImage} />
            ) : (
              <div style={styles.avatar}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            <div style={styles.userText}>
              <p style={{ ...styles.userName, ...(isDark ? styles.userNameDark : {}) }}>
                {user?.name || "Utilisateur"}
              </p>
              <span style={styles.userRole}>{user?.role || ""}</span>
            </div>

            <FiChevronDown size={17} />
          </button>

          {openMenu && (
            <div style={{ ...styles.dropdown, ...(isDark ? styles.dropdownDark : {}) }}>
              <div style={styles.dropdownHeader}>
                {avatar ? (
                  <img src={avatar} alt="avatar" style={styles.dropdownAvatar} />
                ) : (
                  <div style={styles.dropdownAvatarFallback}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                <div>
                  <p style={{ ...styles.dropdownName, ...(isDark ? styles.dropdownNameDark : {}) }}>
                    {user?.name || "Utilisateur"}
                  </p>
                  <span style={styles.dropdownRole}>{user?.role || ""}</span>
                </div>
              </div>

              <div style={{ ...styles.divider, ...(isDark ? styles.dividerDark : {}) }} />

              <button
                style={{ ...styles.dropdownBtn, ...(isDark ? styles.dropdownBtnDark : {}) }}
                onClick={() => goTo("/profile")}
              >
                <FiUser /> Mon profil
              </button>

              <button
                style={{ ...styles.dropdownBtn, ...(isDark ? styles.dropdownBtnDark : {}) }}
                onClick={() => goTo("/change-password")}
              >
                <FiLock /> Changer mot de passe
              </button>

              <div style={{ ...styles.divider, ...(isDark ? styles.dividerDark : {}) }} />

              <button style={styles.dropdownBtnDanger} onClick={handleLogout}>
                <FiLogOut /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: "64px",
    backgroundColor: "#ffffff",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    zIndex: 50,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
  },
  headerDark: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #1e293b",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  titleDark: {
    color: "#f8fafc",
  },
  subtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#64748b",
  },
  rightSide: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  themeButton: {
    height: "42px",
    padding: "0 14px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  themeButtonDark: {
    background: "#1e293b",
    color: "#f8fafc",
    border: "1px solid #334155",
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
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },
  userMenuDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
  },
  userText: {
    textAlign: "left",
  },
  userName: {
    margin: 0,
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "13px",
    textTransform: "capitalize",
  },
  userNameDark: {
    color: "#f8fafc",
  },
  userRole: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
  },
  avatarImage: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #bbf7d0",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#166534",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },
  dropdown: {
    position: "absolute",
    top: "58px",
    right: 0,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "250px",
    zIndex: 1000,
    border: "1px solid #e2e8f0",
  },
  dropdownDark: {
    background: "rgba(15,23,42,0.96)",
    border: "1px solid #334155",
  },
  dropdownHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
  },
  dropdownAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #bbf7d0",
  },
  dropdownAvatarFallback: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#166534",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  dropdownName: {
    margin: 0,
    fontWeight: "800",
    fontSize: "14px",
    color: "#0f172a",
  },
  dropdownNameDark: {
    color: "#f8fafc",
  },
  dropdownRole: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "700",
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "6px 0",
  },
  dividerDark: {
    background: "#334155",
  },
  dropdownBtn: {
    padding: "11px 12px",
    border: "none",
    background: "#ffffff",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "700",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dropdownBtnDark: {
    background: "#1e293b",
    color: "#e2e8f0",
  },
  dropdownBtnDanger: {
    padding: "11px 12px",
    border: "none",
    background: "#fff7f7",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "800",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
};

export default Header;