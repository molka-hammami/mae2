import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

function ForgotPasswordPage() {
  const [personalEmail, setPersonalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!personalEmail.trim()) {
      setError("Veuillez entrer votre email personnel.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personal_email: personalEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Erreur lors de la réinitialisation du mot de passe."
        );
      }

      setSuccess(
        data?.message ||
          "Un nouveau mot de passe provisoire a été envoyé à votre email."
      );
      setPersonalEmail("");
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mot de passe oublié</h1>

        <p style={styles.subtitle}>
          Entrez votre email personnel. Vous recevrez un nouveau mot de passe
          provisoire par email.
        </p>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email personnel"
            value={personalEmail}
            onChange={(e) => setPersonalEmail(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer"}
          </button>
        </form>

        <Link to="/login" style={styles.link}>
          Retour à la connexion
        </Link>
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
    background: "#f1f5f9",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "430px",
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
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.5,
    marginBottom: "22px",
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

  link: {
    display: "block",
    textAlign: "center",
    marginTop: "18px",
    color: "#166534",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "14px",
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

export default ForgotPasswordPage;