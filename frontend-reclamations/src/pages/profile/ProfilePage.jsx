import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

function ProfilePage() {
  const { user } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(
    localStorage.getItem("avatar") || ""
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatar(reader.result);
      localStorage.setItem("avatar", reader.result);
    };

    if (file) reader.readAsDataURL(file);
  };

  const handleSave = () => {
    alert("Profil mis à jour (démo)");
  };

  return (
    <div style={styles.container}>
      <h2>Mon profil</h2>

      <div style={styles.card}>
        <div style={styles.avatarSection}>
          <img
            src={
              avatar ||
              `https://ui-avatars.com/api/?name=${name}`
            }
            alt="avatar"
            style={styles.avatar}
          />

          <input type="file" onChange={handleImageChange} />
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={styles.input}
          />

          <input
            type="text"
            value={user?.role}
            disabled
            style={styles.input}
          />

          <button style={styles.button} onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    display: "flex",
    gap: "40px",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    width: "300px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    background: "#166534",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default ProfilePage;