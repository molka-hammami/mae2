import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";

function ChangePasswordPage() {
  const { user, changePassword, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isStrongPassword = (password) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    return strongPasswordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.currentPassword.trim() ||
      !formData.newPassword.trim() ||
      !formData.confirmPassword.trim()
    ) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    if (!isStrongPassword(formData.newPassword)) {
      setError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
      );
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }

    try {
      await changePassword(formData);

      setSuccess("Mot de passe modifié avec succès.");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err.message || "Erreur lors du changement du mot de passe.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ ...styles.page, ...(isDark ? styles.pageDark : {}) }}>
      <div style={{ ...styles.card, ...(isDark ? styles.cardDark : {}) }}>
        <h1 style={{ ...styles.title, ...(isDark ? styles.titleDark : {}) }}>Premier accès</h1>
        <p style={{ ...styles.subtitle, ...(isDark ? styles.subtitleDark : {}) }}>
          Bonjour {user.name}, vous devez changer votre mot de passe temporaire.
        </p>

        <div style={{ ...styles.rulesBox, ...(isDark ? styles.rulesBoxDark : {}) }}>
          <p style={{ ...styles.rulesTitle, ...(isDark ? styles.rulesTitleDark : {}) }}>
            Le mot de passe doit contenir :
          </p>
          <ul style={{ ...styles.rulesList, ...(isDark ? styles.rulesListDark : {}) }}>
            <li>Au moins 8 caractères</li>
            <li>Une lettre majuscule</li>
            <li>Une lettre minuscule</li>
            <li>Un chiffre</li>
            <li>Un caractère spécial</li>
          </ul>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            name="currentPassword"
            placeholder="Mot de passe actuel"
            value={formData.currentPassword}
            onChange={handleChange}
            style={{ ...styles.input, ...(isDark ? styles.inputDark : {}) }}
          />

          <input
            type="password"
            name="newPassword"
            placeholder="Nouveau mot de passe"
            value={formData.newPassword}
            onChange={handleChange}
            style={{ ...styles.input, ...(isDark ? styles.inputDark : {}) }}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmer le nouveau mot de passe"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={{ ...styles.input, ...(isDark ? styles.inputDark : {}) }}
          />

          <button type="submit" style={styles.button}>
            Mettre à jour le mot de passe
          </button>
        </form>

        <button onClick={logout} style={{ ...styles.logoutButton, ...(isDark ? styles.logoutButtonDark : {}) }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    padding: "20px",
  },
  pageDark: {
    background: "#0b1220",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  cardDark: {
    background: "#111827",
    border: "1px solid #1f2937",
    boxShadow: "0 20px 42px rgba(0,0,0,0.35)",
  },
  title: {
    textAlign: "center",
    margin: "0 0 8px 0",
    color: "#166534",
    fontSize: "28px",
    fontWeight: "700",
  },
  titleDark: {
    color: "#86efac",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  subtitleDark: {
    color: "#cbd5e1",
  },
  rulesBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "18px",
  },
  rulesBoxDark: {
    background: "#0f1b17",
    border: "1px solid #22543d",
  },
  rulesTitle: {
    margin: "0 0 8px 0",
    color: "#166534",
    fontWeight: "700",
    fontSize: "14px",
  },
  rulesTitleDark: {
    color: "#86efac",
  },
  rulesList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#166534",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  rulesListDark: {
    color: "#d1fae5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },
  inputDark: {
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#f8fafc",
  },
  button: {
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    background: "#166534",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
  logoutButton: {
    marginTop: "14px",
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },
  logoutButtonDark: {
    background: "#111827",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    marginBottom: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  success: {
    color: "#16a34a",
    fontSize: "14px",
    marginBottom: "12px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    padding: "10px 12px",
  },
};

export default ChangePasswordPage;
