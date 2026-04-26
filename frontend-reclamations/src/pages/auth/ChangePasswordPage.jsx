import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function ChangePasswordPage() {
  const { user, changePassword, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Premier accès</h1>
        <p style={styles.subtitle}>
          Bonjour {user.name}, vous devez changer votre mot de passe temporaire.
        </p>

        <div style={styles.rulesBox}>
          <p style={styles.rulesTitle}>Le mot de passe doit contenir :</p>
          <ul style={styles.rulesList}>
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
            style={styles.input}
          />

          <input
            type="password"
            name="newPassword"
            placeholder="Nouveau mot de passe"
            value={formData.newPassword}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmer le nouveau mot de passe"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Mettre à jour le mot de passe
          </button>
        </form>

        <button onClick={logout} style={styles.logoutButton}>
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
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    margin: "0 0 8px 0",
    color: "#166534",
    fontSize: "28px",
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  rulesBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "18px",
  },
  rulesTitle: {
    margin: "0 0 8px 0",
    color: "#166534",
    fontWeight: "700",
    fontSize: "14px",
  },
  rulesList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#166534",
    fontSize: "14px",
    lineHeight: 1.6,
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