import { useContext, useEffect, useRef, useState } from "react";
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
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= 900);
  const menuRef = useRef(null);

  useEffect(() => {
    const loadAvatar = () => {
      if (!user?.id) return setAvatar("");
      setAvatar(localStorage.getItem(`avatar_${user.id}`) || "");
    };

    loadAvatar();
    window.addEventListener("avatarUpdated", loadAvatar);

    return () => window.removeEventListener("avatarUpdated", loadAvatar);
  }, [user]);

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth <= 900);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!openMenu) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

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
    <header
      style={{
        ...styles.header,
        ...(isCompact ? styles.headerCompact : {}),
        ...(isDark ? styles.headerDark : {}),
      }}
    >
      <div style={isCompact ? styles.headingCompact : undefined}>
        <h2 style={{ ...styles.title, ...(isDark ? styles.titleDark : {}) }}>
          Tableau de bord
        </h2>
        <p style={styles.subtitle}>Bienvenue dans votre espace de gestion</p>
      </div>

      <div style={{ ...styles.rightSide, ...(isCompact ? styles.rightSideCompact : {}) }}>
        <button
          type="button"
          style={{
            ...styles.themeButton,
            ...(isCompact ? styles.themeButtonCompact : {}),
            ...(isDark ? styles.themeButtonDark : {}),
          }}
          onClick={toggleTheme}
        >
          {isDark ? <FiSun /> : <FiMoon />}
          {!isCompact && (isDark ? "Clair" : "Sombre")}
        </button>

        <div ref={menuRef} style={styles.userMenuWrapper}>
          <button
            type="button"
            style={{
              ...styles.userMenu,
              ...(isCompact ? styles.userMenuCompact : {}),
              ...(isDark ? styles.userMenuDark : {}),
            }}
            onClick={() => setOpenMenu(!openMenu)}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" style={styles.avatarImage} />
            ) : (
              <div style={styles.avatar}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            <div style={{ ...styles.userText, ...(isCompact ? styles.userTextCompact : {}) }}>
              <p style={{ ...styles.userName, ...(isDark ? styles.userNameDark : {}) }}>
                {user?.name || "Utilisateur"}
              </p>
              <span style={styles.userRole}>{user?.role || ""}</span>
            </div>

            <FiChevronDown size={17} />
          </button>

          {openMenu && (
            <div
              style={{
                ...styles.dropdown,
                ...(isCompact ? styles.dropdownCompact : {}),
                ...(isDark ? styles.dropdownDark : {}),
              }}
            >
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
    zIndex: 9000,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
  },
  headerCompact: {
    padding: "0 12px",
  },
  headingCompact: {
    display: "none",
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
  rightSideCompact: {
    width: "100%",
    justifyContent: "space-between",
    gap: "10px",
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
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  themeButtonCompact: {
    width: "42px",
    padding: 0,
    justifyContent: "center",
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
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  userMenuCompact: {
    minWidth: 0,
    padding: "6px 8px",
  },
  userMenuDark: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
  },
  userText: {
    textAlign: "left",
  },
  userTextCompact: {
    display: "none",
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
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "250px",
    zIndex: 9100,
    border: "1px solid #e2e8f0",
    boxSizing: "border-box",
  },
  dropdownCompact: {
    position: "fixed",
    top: "76px",
    left: "12px",
    right: "12px",
    minWidth: 0,
  },
  dropdownDark: {
    background: "#0f172a",
    border: "1px solid #334155",
  },
  dropdownHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    userSelect: "none",
    WebkitUserSelect: "none",
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
    userSelect: "none",
    WebkitUserSelect: "none",
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
    userSelect: "none",
    WebkitUserSelect: "none",
  },
};

export default Header;
