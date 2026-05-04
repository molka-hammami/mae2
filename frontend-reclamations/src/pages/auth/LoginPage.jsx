import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/mae.png";
function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const loggedUser = await login(formData);

      if (loggedUser?.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Erreur de connexion.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
  
  <img src={logo} alt="MAE Logo" style={styles.logo} />
        <h1 style={styles.title}>MAE Assurances</h1>

        <p style={styles.subtitle}>
          Connexion à la plateforme de gestion des réclamations
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            name="email"
            placeholder="Email professionnel"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Se connecter
          </button>
        </form>

        <Link to="/forgot-password" style={styles.forgotLink}>
          Mot de passe oublié ?
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
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  title: {
    textAlign: "center",
    marginBottom: "8px",
    color: "#166534",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#64748b",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  logo: {
  width: "76px",
  height: "76px",
  objectFit: "contain",
  borderRadius: "50%",
  padding: "8px",
  background: "#ffffff",
  boxShadow: "0 10px 25px rgba(22, 101, 52, 0.18)",
  margin: "0 auto 14px",
  display: "block",
},
loginBox: {
  width: "440px",
  background: "#ffffff",
  borderRadius: "28px",
  padding: "34px 36px",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
  textAlign: "center",
},
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
  },

  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#166534",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },


  forgotLink: {
    display: "block",
    textAlign: "center",
    marginTop: "16px",
    color: "#166534",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "14px",
  },

  error: {
    color: "#dc2626",
    fontSize: "14px",
    marginBottom: "12px",
  },
};

export default LoginPage;