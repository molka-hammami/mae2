import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const CATEGORY_OPTIONS = [
  "SINISTRE AUTO",
  "SERVICE CLIENT",
  "SINISTRE VIE",
  "SINISTRE IRDS",
];

const ROLE_OPTIONS = ["AGENT", "ADMIN"];

const initialForm = {
  name: "",
  email: "", // email personnel
  password: "",
  role: "AGENT",
  assigned_category: "",
  is_active: true,
};

const buildMaeLoginFromPersonalEmail = (personalEmail) => {
  const username = personalEmail.trim().toLowerCase().split("@")[0];
  return `${username}@mae.tn`;
};

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.id - b.id);
  }, [users]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/users/`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs.");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.personal_email || "",
      password: "",
      role: user.role || "AGENT",
      assigned_category: user.assigned_category || "",
      is_active: user.is_active ?? true,
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Le nom est obligatoire.";
    }

    if (!formData.email.trim()) {
      return "L'email personnel est obligatoire.";
    }

    if (!formData.email.includes("@")) {
      return "Veuillez écrire un email personnel valide, exemple : agent@gmail.com.";
    }

    if (!editingUser && !formData.password.trim()) {
      return "Le mot de passe temporaire est obligatoire.";
    }

    if (formData.role === "AGENT" && !formData.assigned_category.trim()) {
      return "La catégorie assignée est obligatoire pour un agent.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const personalEmail = formData.email.trim().toLowerCase();

      const payload = {
        name: formData.name.trim(),
        email: buildMaeLoginFromPersonalEmail(personalEmail),
        personal_email: personalEmail,
        role: formData.role,
        assigned_category:
          formData.role === "AGENT" ? formData.assigned_category : null,
        is_active: formData.is_active,
      };

      if (!editingUser || formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const url = editingUser
        ? `${API_BASE}/users/${editingUser.id}/`
        : `${API_BASE}/users/`;

      const method = editingUser ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data =
        response.status !== 204 ? await response.json().catch(() => null) : null;

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            "Erreur lors de l'enregistrement de l'utilisateur."
        );
      }

      setSuccess(
        editingUser
          ? "Utilisateur modifié avec succès."
          : "Utilisateur créé avec succès."
      );

      await loadUsers();

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmDelete = window.confirm(
      `Voulez-vous vraiment supprimer ${user.name} ?`
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/users/${user.id}/`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Erreur lors de la suppression.");
      }

      setSuccess("Utilisateur supprimé avec succès.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des utilisateurs</h1>
          <p style={styles.subtitle}>
            Créez, modifiez et supprimez les comptes agents.
          </p>
        </div>

        <button style={styles.primaryButton} onClick={openCreateModal}>
          + Ajouter un agent
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <div style={styles.card}>
        {loading ? (
          <p style={styles.message}>Chargement des utilisateurs...</p>
        ) : sortedUsers.length === 0 ? (
          <p style={styles.message}>Aucun utilisateur disponible.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Login</th>
                <th style={styles.th}>Email personnel</th>
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Catégorie</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Premier accès</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>#{user.id}</td>
                  <td style={styles.tdStrong}>{user.name}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.personal_email || "-"}</td>
                  <td style={styles.td}>
                    <span
                      style={
                        user.role === "ADMIN"
                          ? styles.roleAdminBadge
                          : styles.roleAgentBadge
                      }
                    >
                      {user.role}
                    </span>
                  </td>
                  <td style={styles.td}>{user.assigned_category || "-"}</td>
                  <td style={styles.td}>
                    <span
                      style={
                        user.is_active
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      {user.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={
                        user.must_change_password
                          ? styles.mustChangeBadge
                          : styles.doneBadge
                      }
                    >
                      {user.must_change_password ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.editButton}
                        onClick={() => openEditModal(user)}
                      >
                        Modifier
                      </button>

                      {user.role !== "ADMIN" && (
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDelete(user)}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingUser ? "Modifier l'utilisateur" : "Créer un agent"}
              </h2>

              <button style={styles.closeButton} onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Nom complet"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email personnel</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="ex: agent@gmail.com"
                />

                {formData.email.includes("@") && (
                  <p style={styles.generatedLogin}>
                    Login généré :{" "}
                    {buildMaeLoginFromPersonalEmail(formData.email)}
                  </p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {editingUser
                    ? "Nouveau mot de passe temporaire (optionnel)"
                    : "Mot de passe temporaire"}
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ex: Agent123"
                />
              </div>

              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rôle</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Catégorie assignée</label>
                  <select
                    name="assigned_category"
                    value={formData.assigned_category}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={formData.role !== "AGENT"}
                  >
                    <option value="">Choisir une catégorie</option>
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span>Compte actif</span>
              </label>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={closeModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingUser
                    ? "Mettre à jour"
                    : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#1e293b",
    fontWeight: "700",
  },

  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "15px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1150px",
  },

  th: {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "700",
  },

  td: {
    padding: "16px 12px",
    borderBottom: "1px solid #eef2f7",
    color: "#1e293b",
    fontSize: "14px",
  },

  tdStrong: {
    padding: "16px 12px",
    borderBottom: "1px solid #eef2f7",
    color: "#1e293b",
    fontSize: "14px",
    fontWeight: "700",
  },

  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  roleAdminBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: "12px",
  },

  roleAgentBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#15803d",
    fontWeight: "700",
    fontSize: "12px",
  },

  activeBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#15803d",
    fontWeight: "700",
    fontSize: "12px",
  },

  inactiveBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#dc2626",
    fontWeight: "700",
    fontSize: "12px",
  },

  mustChangeBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#b45309",
    fontWeight: "700",
    fontSize: "12px",
  },

  doneBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#475569",
    fontWeight: "700",
    fontSize: "12px",
  },

  editButton: {
    border: "none",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: "700",
    padding: "9px 12px",
    cursor: "pointer",
  },

  deleteButton: {
    border: "none",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: "700",
    padding: "9px 12px",
    cursor: "pointer",
  },

  primaryButton: {
    border: "none",
    borderRadius: "12px",
    background: "#166534",
    color: "#ffffff",
    fontWeight: "700",
    padding: "12px 18px",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: "700",
    padding: "12px 18px",
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "640px",
    background: "#ffffff",
    borderRadius: "22px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.18)",
    padding: "24px",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#1e293b",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
    color: "#64748b",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },

  input: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },

  generatedLogin: {
    margin: "6px 0 0 0",
    color: "#166534",
    fontSize: "13px",
    fontWeight: "700",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontWeight: "600",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "6px",
  },

  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "12px 14px",
    fontWeight: "600",
  },

  successBox: {
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "12px 14px",
    fontWeight: "600",
  },

  message: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
  },
};

export default UsersPage;