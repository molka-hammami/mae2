import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";

function ProfilePage() {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const fileInputRef = useRef(null);
  const isDark = theme === "dark";

  const avatarKey = user?.id ? `avatar_${user.id}` : null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    setName(user.name || "");
    setEmail(user.email || "");
    const savedPersonalEmail = localStorage.getItem(`personal_email_${user.id}`);
setRecoveryEmail(user.personal_email || savedPersonalEmail || "");
    const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
    setAvatar(savedAvatar || "");
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !avatarKey) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatar(reader.result);
      localStorage.setItem(avatarKey, reader.result);
      window.dispatchEvent(new Event("avatarUpdated"));
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!avatarKey) return;

    setAvatar("");
    localStorage.removeItem(avatarKey);
    window.dispatchEvent(new Event("avatarUpdated"));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const payload = {
      name,
      email,
      personal_email: recoveryEmail,
    };

    const response = await fetch(`http://127.0.0.1:8000/api/users/${user.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Erreur lors de la mise à jour du profil");
      return;
    }

    alert("Profil mis à jour avec succès");
   localStorage.setItem(`personal_email_${user.id}`, recoveryEmail);
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
  <div style={styles.container}>
    <div style={styles.header}>
      <h2 style={{ ...styles.title, ...(isDark ? styles.titleDark : {}) }}>Mon profil</h2>
      <p style={{ ...styles.subtitle, ...(isDark ? styles.subtitleDark : {}) }}>
        Gérez vos informations personnelles et votre email de récupération.
      </p>
    </div>

    <div style={{ ...styles.card, ...(isDark ? styles.cardDark : {}) }}>
      <div style={{ ...styles.profileLeft, ...(isDark ? styles.profileLeftDark : {}) }}>
        <div style={styles.avatarGlow}>
          {avatar ? (
            <img src={avatar} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.defaultAvatar}>
              {name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}
        </div>

        <h3 style={{ ...styles.profileName, ...(isDark ? styles.profileNameDark : {}) }}>
          {name || "Utilisateur"}
        </h3>
        <span style={{ ...styles.roleBadge, ...(isDark ? styles.roleBadgeDark : {}) }}>
          {user?.role}
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />

        <div style={styles.photoButtons}>
          <button
            type="button"
            style={styles.changePhotoBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Modifier la photo
          </button>

          {avatar && (
            <button
              type="button"
              style={styles.removePhotoBtn}
              onClick={handleRemovePhoto}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div style={styles.profileRight}>
        <h3 style={{ ...styles.sectionTitle, ...(isDark ? styles.sectionTitleDark : {}) }}>
          Informations du compte
        </h3>

        <label style={{ ...styles.label, ...(isDark ? styles.labelDark : {}) }}>Nom complet</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom"
          style={{ ...styles.input, ...(isDark ? styles.inputDark : {}) }}
        />

        <label style={{ ...styles.label, ...(isDark ? styles.labelDark : {}) }}>Email principal</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email principal"
          style={{ ...styles.input, ...(isDark ? styles.inputDark : {}) }}
        />

        <label style={{ ...styles.label, ...(isDark ? styles.labelDark : {}) }}>Email de récupération</label>
        <input
          type="email"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          placeholder="exemple@gmail.com"
          style={{ ...styles.input, ...(isDark ? styles.inputDark : {}) }}
        />

        <label style={{ ...styles.label, ...(isDark ? styles.labelDark : {}) }}>Rôle</label>
        <input
          type="text"
          value={user?.role || ""}
          disabled
          style={{
            ...styles.input,
            ...(isDark ? styles.inputDark : {}),
            ...styles.disabledInput,
            ...(isDark ? styles.disabledInputDark : {}),
          }}
        />

        <button type="button" style={styles.button} onClick={handleSave}>
          Enregistrer les modifications
        </button>
      </div>
    </div>
  </div>
);
}
const styles = {
  container: {
    padding: "34px",
  },

  header: {
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: "900",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },

  card: {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "34px",
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "42px",
    alignItems: "stretch",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
    maxWidth: "980px",
  },

  cardDark: {
    background: "#111827",
    border: "1px solid #1f2937",
    boxShadow: "0 20px 48px rgba(0, 0, 0, 0.35)",
  },

  profileLeft: {
    background: "linear-gradient(135deg, #f0fdf4, #ffffff)",
    border: "1px solid #dcfce7",
    borderRadius: "24px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
  },

  profileLeftDark: {
    background: "linear-gradient(135deg, #0f1b17, #17212f)",
    border: "1px solid #233244",
  },

  avatarGlow: {
    width: "138px",
    height: "138px",
    borderRadius: "50%",
    padding: "6px",
    background: "linear-gradient(135deg, #166534, #86efac)",
    boxShadow: "0 18px 35px rgba(22, 101, 52, 0.22)",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    background: "#ffffff",
  },

  defaultAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#166534",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "54px",
    fontWeight: "900",
  },

  profileName: {
    margin: "8px 0 0",
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: "900",
  },

  profileNameDark: {
    color: "#f8fafc",
  },

  roleBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
  },

  roleBadgeDark: {
    background: "#173226",
    color: "#86efac",
  },

  photoButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "8px",
  },

  changePhotoBtn: {
    border: "none",
    backgroundColor: "#166534",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800",
  },

  removePhotoBtn: {
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800",
  },

  profileRight: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  sectionTitle: {
    margin: "0 0 20px",
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: "900",
  },

  sectionTitleDark: {
    color: "#f8fafc",
  },

  label: {
    marginBottom: "6px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "800",
  },

  labelDark: {
    color: "#cbd5e1",
  },

  input: {
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    marginBottom: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },

  inputDark: {
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#f8fafc",
  },

  disabledInput: {
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
  },

  disabledInputDark: {
    background: "#111827",
    color: "#94a3b8",
  },

  button: {
    marginTop: "8px",
    background: "#166534",
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px",
    boxShadow: "0 12px 24px rgba(22, 101, 52, 0.22)",
  },

  titleDark: {
    color: "#f8fafc",
  },

  subtitleDark: {
    color: "#94a3b8",
  },
};
export default ProfilePage;
