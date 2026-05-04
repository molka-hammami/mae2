import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

function ProfilePage() {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [recoveryEmail, setRecoveryEmail] = useState(user?.recovery_email || "");
  const avatarKey = user?.id ? `avatar_${user.id}` : null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    setName(user.name || "");
    setEmail(user.email || "");

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

  const handleSave = () => {
    alert("Profil mis à jour avec succès");
  };
const payload = {
  name,
  email,
  recovery_email: recoveryEmail,
};
  if (!user) return null;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mon profil</h2>

      <div style={styles.card}>
        <div style={styles.avatarSection}>
          {avatar ? (
            <img src={avatar} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.defaultAvatar}>
              {name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}

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

        <div style={styles.form}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom"
            style={styles.input}
          />
          <input
  type="email"
  value={recoveryEmail}
  onChange={(e) => setRecoveryEmail(e.target.value)}
  placeholder="Email de récupération"
  style={styles.input}
/>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={styles.input}
          />

          <input type="text" value={user?.role || ""} disabled style={styles.input} />

          <button style={styles.button} onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "30px" },
  title: { marginBottom: "20px", color: "#0f172a" },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    display: "flex",
    gap: "50px",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    minWidth: "220px",
  },
  avatar: {
    width: "115px",
    height: "115px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #dcfce7",
  },
  defaultAvatar: {
    width: "115px",
    height: "115px",
    borderRadius: "50%",
    backgroundColor: "#166534",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "44px",
    fontWeight: "700",
    border: "4px solid #dcfce7",
  },
  photoButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  changePhotoBtn: {
    border: "none",
    backgroundColor: "#166534",
    color: "#ffffff",
    padding: "9px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },
  removePhotoBtn: {
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "9px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    width: "320px",
  },
  input: {
    padding: "11px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  button: {
    background: "#166534",
    color: "#fff",
    padding: "11px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default ProfilePage;