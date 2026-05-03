import { useContext, useEffect, useState } from "react";
import { FiChevronDown, FiLock, FiLogOut, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function Header() {
  const { user, logout } = useContext(AuthContext);
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

  return (
    <header style={styles.header}>
      <div>
        <h2 style={styles.title}>Tableau de bord</h2>
        <p style={styles.subtitle}>Bienvenue dans votre espace de gestion</p>
      </div>

      <div style={styles.userMenuWrapper}>
        <button
          type="button"
          style={styles.userMenu}
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
            <p style={styles.userName}>{user?.name || "Utilisateur"}</p>
            <span style={styles.userRole}>{user?.role || ""}</span>
          </div>

          <FiChevronDown size={17} />
        </button>

        {openMenu && (
          <div style={styles.dropdown}>
            <button style={styles.dropdownBtn} onClick={() => goTo("/profile")}>
              <FiUser /> Mon profil
            </button>

            <button
              style={styles.dropdownBtn}
              onClick={() => goTo("/change-password")}
            >
              <FiLock /> Changer mot de passe
            </button>

            <button style={styles.dropdownBtnDanger} onClick={handleLogout}>
              <FiLogOut /> Déconnexion
            </button>
          </div>
        )}
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

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#64748b",
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
    borderRadius: "14px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: "230px",
    zIndex: 1000,
    border: "1px solid #e2e8f0",
  },

  dropdownBtn: {
    padding: "11px 12px",
    border: "none",
    background: "#ffffff",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "600",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  dropdownBtnDanger: {
    padding: "11px 12px",
    border: "none",
    background: "#fff7f7",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "700",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
};

export default Header;