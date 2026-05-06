import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
function ComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
const isDark = theme === "dark";
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [internalNote, setInternalNote] = useState("");
  const [savingInternalNote, setSavingInternalNote] = useState(false);

  const categories = [
    "SINISTRE AUTO",
    "SINISTRE VIE",
    "SERVICE CLIENT",
    "SINISTRE IRDS",
  ];

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://127.0.0.1:8000/api/reclamations/${id}/?role=${
            user?.role || ""
          }&actor_name=${encodeURIComponent(user?.name || "")}`
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement du détail");
        }

        const data = await response.json();

        setComplaint(data);
        setSelectedCategory(data?.category || "");
        setAdminNote(data?.admin_note || "");
        setInternalNote(data?.internal_note || "");
      } catch (err) {
        setError(err.message || "Erreur lors du chargement du détail");
      } finally {
        setLoading(false);
      }
    };

    loadComplaint();
  }, [id, user?.role, user?.name]);

  const isNotClassified =
    !complaint?.category ||
    complaint.category === null ||
    complaint.category === "" ||
    complaint.category === "NON CLASSÉE" ||
    complaint.category === "Non classée";

  const handleSaveInternalNote = async () => {
    try {
      setSavingInternalNote(true);

      const response = await fetch(
        `http://127.0.0.1:8000/api/reclamations/${id}/internal-note/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            internal_note: internalNote,
            actor_name: user?.name || "Agent",
            actor_role: user?.role || "AGENT",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement de la note agent");
      }

      const updatedComplaint = await response.json();
      setComplaint(updatedComplaint);
      setInternalNote(updatedComplaint.internal_note || "");
      alert("Note agent enregistrée avec succès");
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSavingInternalNote(false);
    }
  };

  const handleMarkAsProcessed = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/reclamations/${id}/mark-processed/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actor_name: user?.name || "",
            actor_role: user?.role || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du traitement de la réclamation");
      }

      const data = await response.json();
      setComplaint(data);
      alert("Réclamation marquée comme traitée");
    } catch (err) {
      alert(err.message || "Erreur lors du traitement");
    }
  };

  const handleSaveAdminNote = async () => {
    try {
      setSavingNote(true);

      const response = await fetch(
        `http://127.0.0.1:8000/api/reclamations/${id}/admin-note/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_note: adminNote,
            actor_name: user?.name || "Admin",
            actor_role: user?.role || "ADMIN",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement de la note admin");
      }

      const updatedComplaint = await response.json();
      setComplaint(updatedComplaint);
      setAdminNote(updatedComplaint.admin_note || "");
      alert("Note admin enregistrée avec succès");
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSavingNote(false);
    }
  };

  const handleValidateClassification = async () => {
    if (!selectedCategory) {
      alert("Veuillez choisir une catégorie.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/reclamations/${id}/classify/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: selectedCategory,
            actor_name: user?.name || "Admin",
            actor_role: user?.role || "ADMIN",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la classification.");
      }

      const updatedComplaint = await response.json();
      setComplaint(updatedComplaint);
      setSelectedCategory(updatedComplaint.category || "");
      alert("Classification validée avec succès.");
    } catch (err) {
      alert(err.message || "Erreur lors de la classification.");
    }
  };

  if (loading) {
    return <p style={styles.message}>Chargement du détail...</p>;
  }

  if (error) {
    return <p style={styles.error}>{error}</p>;
  }

  if (!complaint) {
    return <p style={styles.error}>Réclamation introuvable.</p>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.breadcrumb}>
        <button onClick={() => navigate("/complaints")} style={styles.backLink}>
          ← Réclamations
        </button>
        <span style={styles.breadcrumbSep}>›</span>
        <span style={styles.breadcrumbCurrent}>Détail de la réclamation</span>
      </div>

      <div style={styles.headerRow}>
        <div>
          <h1 style={{ ...styles.title, ...(isDark ? styles.darkTitle : {}) }}>Détail de la réclamation</h1>
          
          <p style={{ ...styles.subtitle, ...(isDark ? styles.darkMutedText : {}) }}>            Consultez toutes les informations liées à cette réclamation.
</p>
        </div>

        <div style={styles.headerActions}>
          {user?.role === "AGENT" && complaint.status !== "TRAITEE" && (
            <button onClick={handleMarkAsProcessed} style={styles.processButton}>
              ✔ Marquer comme traitée
            </button>
          )}

          <button style={styles.actionsButton}>Actions ⋮</button>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.leftColumn}>
          <div style={styles.infoGrid}>
            <InfoCard
              icon="f"
              iconCircleStyle={styles.facebookCircle}
              label="Source"
              value={complaint.source || "-"}
              isDark={isDark}
            />

            <InfoCard
              icon="📅"
              isDark={isDark}
              label="Date commentaire"
              value={complaint.comment_date || "-"}
            />

            <InfoCard
              icon="🏷"
              label="Catégorie"
              isDark={isDark}
              value={
                <span
  style={{
    ...(isNotClassified
      ? styles.inlineCategoryNoClass
      : styles.inlineCategory),
    ...(isDark ? styles.darkCategoryBadge : {}),
  }}
>
  {isNotClassified ? "NON CLASSÉE" : complaint.category}
</span>
              }
            />

            <InfoCard
              icon="⚠"
              label="Urgence"
              isDark={isDark}
              value={
                <span style={getUrgencyBadgeStyle(complaint.urgency)}>
                  {formatUrgency(complaint.urgency)}
                </span>
              }
            />

            <InfoCard
              icon="👤"
              label="Statut"
              isDark={isDark}
              value={
                <span style={getStatusBadgeStyle(complaint.status)}>
                  {formatStatus(complaint.status)}
                </span>
              }
            />

            <InfoCard
              icon="👤"
              label="Affecté à"
              isDark={isDark}
              value={complaint.assigned_agent || "Non affecté"}
            />

            <InfoCard
              icon="🛡"
              isDark={isDark}
              label="Classée par admin"
              value={complaint.category_assigned_by_admin ? "Oui" : "Non"}
            />

            <InfoCard
              icon="🗓"
              isDark={isDark}
              label="Date ouverture"
              value={formatDateTime(complaint.opened_at)}
            />

            <InfoCard
              icon="🗓"
              isDark={isDark}
              label="Date traitement"
              value={formatDateTime(complaint.processed_at)}
            />

            <InfoCard
              icon="🗓"
              isDark={isDark}
              label="Date assignation catégorie"
              value={formatDateTime(complaint.category_assigned_at)}
            />
          </div>

          {isNotClassified && (
            <div style={{ ...styles.sectionCard, ...(isDark ? styles.darkCard : {}) }}>
              <h2 style={{ ...styles.sectionTitle, ...(isDark ? styles.darkTitle : {}) }}>Classer la réclamation</h2>

              <div style={styles.classifyRow}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ ...styles.select, ...(isDark ? styles.darkInput : {}) }}
                >
                  <option value="">Choisir une catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleValidateClassification}
                  style={styles.classifyButton}
                >
                  ✓ Valider la classification
                </button>
              </div>
            </div>
          )}

          <div style={{ ...styles.sectionCard, ...(isDark ? styles.darkCard : {}) }}>
            <div style={styles.sectionHeaderWithIcon}>
              <span style={styles.sectionIcon}>📄</span>
              <h2 style={{ ...styles.sectionTitleNoMargin, ...(isDark ? styles.darkTitle : {}) }}>
                Texte complet de la réclamation
              </h2>
            </div>

            <div style={{ ...styles.textBox, ...(isDark ? styles.darkTextBox : {}) }}>
              {complaint.text_original || "Aucun texte disponible."}
            </div>
          </div>

          <div style={styles.bottomNotesGrid}>
            <div style={{ ...styles.sectionCard, ...(isDark ? styles.darkCard : {}) }}>
              <div style={styles.sectionHeaderWithIcon}>
                <span style={styles.sectionIcon}>📝</span>
                <h2 style={{ ...styles.sectionTitleNoMargin, ...(isDark ? styles.darkTitle : {}) }}>Note admin</h2>
              </div>

              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Écrire une note admin..."
                style={{ ...styles.textarea, ...(isDark ? styles.darkTextarea : {}) }}
                disabled={user?.role !== "ADMIN"}
              />

              {user?.role === "ADMIN" && (
                <div style={styles.noteActions}>
                  <button
                    onClick={handleSaveAdminNote}
                    style={styles.saveButton}
                    disabled={savingNote}
                  >
                    {savingNote ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              )}
            </div>

            <div style={{ ...styles.sectionCard, ...(isDark ? styles.darkCard : {}) }}>
              <div style={styles.sectionHeaderWithIcon}>
                <span style={styles.sectionIcon}>🔒</span>
                <h2 style={{ ...styles.sectionTitleNoMargin, ...(isDark ? styles.darkTitle : {}) }}>Note interne</h2>
              </div>

              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Écrire une note agent..."
                style={{ ...styles.textarea, ...(isDark ? styles.darkTextarea : {}) }}
                disabled={user?.role !== "AGENT"}
              />

              {user?.role === "AGENT" && (
                <div style={styles.noteActions}>
                  <button
                    onClick={handleSaveInternalNote}
                    style={styles.saveButton}
                    disabled={savingInternalNote}
                  >
                    {savingInternalNote ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
         <div style={{ ...styles.sideCard, ...(isDark ? styles.darkCard : {}) }}>
          
            <h3 style={{ ...styles.sideTitle, ...(isDark ? styles.darkTitle : {}) }}>
  Informations générales
</h3>

            <div style={styles.sideList}>
              <SideRow label="Créée le" value={complaint.comment_date || "-"} icon="📅" />

              <SideRow
                label="URL réclamation"
                value={
                  complaint.comment_url ? (
                    <a
                      href={complaint.comment_url}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.link}
                    >
                      Ouvrir le lien
                    </a>
                  ) : (
                    "-"
                  )
                }
                icon="🔗"
              />

              <SideRow
                label="Dernière mise à jour"
                value={formatDateTime(
                  complaint.processed_at ||
                    complaint.opened_at ||
                    complaint.category_assigned_at
                )}
                icon="🕘"
              />

              <SideRow
                label="Créé par"
                value={
                  complaint.author_name ||
                  (complaint.source === "facebook"
                    ? "Utilisateur Facebook"
                    : capitalize(complaint.source) || "Utilisateur")
                }
                icon="👤"
              />

              <SideRow
                label="IP source"
                value={complaint.ip_source || "192.168.1.1"}
                icon="🌐"
              />
            </div>
          </div>
<div style={{ ...styles.sideCard, ...(isDark ? styles.darkCard : {}) }}>
  <h3 style={{ ...styles.sideTitle, ...(isDark ? styles.darkTitle : {}) }}>
    Informations générales
  </h3>
  <h3 style={{ ...styles.sideTitle, ...(isDark ? styles.darkTitle : {}) }}>
    Historique
  </h3>
            <div style={styles.timeline}>
              {(complaint.action_logs || []).length > 0 ? (
                complaint.action_logs.map((log) => (
                  <TimelineItem
                    key={log.id}
                    title={formatAction(log.action)}
                    time={formatDateTime(log.created_at)}
                    badge={log.actor_name}
                    details={log.details}
                    isDark={isDark}
                  />
                ))
              ) : (
               <p style={{ ...styles.message, ...(isDark ? styles.darkMutedText : {}) }}>
  Aucune action enregistrée.
</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, iconCircleStyle, isDark }) {
  return (
    <div style={{ ...styles.infoCard, ...(isDark ? styles.darkCard : {}) }}>
      <div style={styles.infoTop}>
        <div style={iconCircleStyle || styles.defaultIconCircle}>{icon}</div>

        <span style={{ ...styles.infoLabel, ...(isDark ? styles.darkMutedText : {}) }}>
          {label}
        </span>
      </div>

      <div style={{ ...styles.infoValue, ...(isDark ? styles.darkText : {}) }}>
        {value || "-"}
      </div>
    </div>
  );
}

function SideRow({ icon, label, value, isDark }) {
  return (
    <div style={styles.sideRow}>
      <span style={styles.sideIcon}>{icon}</span>

      <span style={{ ...styles.sideLabel, ...(isDark ? styles.darkMutedText : {}) }}>
        {label}
      </span>

      <span style={{ ...styles.sideValue, ...(isDark ? styles.darkText : {}) }}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ title, time, badge, details, isDark }) {
  return (
    <div style={styles.timelineItem}>
      <div style={styles.timelineDot}></div>

      <div style={styles.timelineContent}>
        <div style={styles.timelineTitleRow}>
          <span style={{ ...styles.timelineTitle, ...(isDark ? styles.darkText : {}) }}>
            {title}
          </span>

          {badge && <span style={styles.timelineBadge}>{badge}</span>}
        </div>

        <div style={{ ...styles.timelineTime, ...(isDark ? styles.darkMutedText : {}) }}>
          {time || "-"}
        </div>

        {details && (
          <div style={{ ...styles.timelineDetails, ...(isDark ? styles.darkMutedText : {}) }}>
            {details}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAction(action) {
  const map = {
    PRISE_EN_CHARGE: "Prise en charge",
    STATUT_CHANGE: "Statut changé",
    NOTE_AGENT: "Note agent",
    NOTE_ADMIN: "Note admin",
    TRAITEMENT_TERMINE: "Traitement terminé",
    CLASSIFICATION_VALIDEE: "Classification validée",
  };

  return map[action] || action;
}

function formatStatus(status) {
  if (!status) return "-";

  const map = {
    EN_COURS: "EN_COURS",
    EN_ATTENTE: "EN_ATTENTE",
    TRAITEE: "TRAITÉE",
    TRAITÉE: "TRAITÉE",
  };

  return map[status] || status;
}

function formatUrgency(urgency) {
  if (!urgency) return "-";

  const map = {
    elevee: "élevée",
    élevée: "élevée",
    moyenne: "moyenne",
    faible: "faible",
  };

  return map[urgency] || urgency;
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusBadgeStyle(status) {
  if (status === "EN_ATTENTE") {
    return {
      ...styles.badgePill,
      backgroundColor: "#fee2e2",
      color: "#dc2626",
    };
  }

  if (status === "EN_COURS") {
    return {
      ...styles.badgePill,
      backgroundColor: "#fef3c7",
      color: "#d97706",
    };
  }

  if (status === "TRAITEE" || status === "TRAITÉE") {
    return {
      ...styles.badgePill,
      backgroundColor: "#dcfce7",
      color: "#15803d",
    };
  }

  return {
    ...styles.badgePill,
    backgroundColor: "#f1f5f9",
    color: "#475569",
  };
}

function getUrgencyBadgeStyle(urgency) {
  if (urgency === "faible") {
    return {
      ...styles.badgePill,
      backgroundColor: "#dcfce7",
      color: "#15803d",
    };
  }

  if (urgency === "moyenne") {
    return {
      ...styles.badgePill,
      backgroundColor: "#fef3c7",
      color: "#b45309",
    };
  }

  return {
    ...styles.badgePill,
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  };
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#64748b",
    fontSize: "14px",
  },

  backLink: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
  },

  breadcrumbSep: {
    color: "#94a3b8",
  },

  breadcrumbCurrent: {
    color: "#64748b",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "44px",
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "10px",
    color: "#64748b",
    fontSize: "17px",
  },

  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },

  actionsButton: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px 18px",
    color: "#334155",
    fontWeight: "600",
    cursor: "pointer",
  },

  processButton: {
    backgroundColor: "#15803d",
    color: "#ffffff",
    padding: "12px 18px",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2.2fr 0.8fr",
    gap: "18px",
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    alignItems: "start",
  },

  infoCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
    minHeight: "102px",
  },

  infoTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  defaultIconCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },

  facebookCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    backgroundColor: "#e0ecff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
  },

  infoLabel: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },

  infoValue: {
    fontSize: "17px",
    color: "#0f172a",
    fontWeight: "700",
    wordBreak: "break-word",
  },

  sectionCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "14px",
  },

  sectionTitleNoMargin: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  sectionHeaderWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },

  sectionIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    backgroundColor: "#eaf7ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },

  classifyRow: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.8fr",
    gap: "14px",
  },

  select: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #dbe1e8",
    fontSize: "15px",
    color: "#334155",
    backgroundColor: "#ffffff",
    outline: "none",
  },

  darkInput: {
    backgroundColor: "#111827",
    border: "1px solid #334155",
    color: "#f8fafc",
  },

  classifyButton: {
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#15803d",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    padding: "14px 18px",
  },

  textBox: {
    backgroundColor: "#f6fbf8",
    border: "1px solid #cfe9d8",
    borderRadius: "12px",
    padding: "16px",
    fontSize: "16px",
    lineHeight: 1.9,
    color: "#0f172a",
    whiteSpace: "pre-wrap",
  },

  darkTextBox: {
    backgroundColor: "#111827",
    border: "1px solid #334155",
    color: "#e2e8f0",
  },

  bottomNotesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    padding: "14px",
    fontSize: "15px",
    color: "#334155",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    background: "#f8fafc",
  },

  darkTextarea: {
    background: "#111827",
    border: "1px solid #334155",
    color: "#f8fafc",
  },

  noteActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "12px",
  },

  saveButton: {
    height: "42px",
    padding: "0 18px",
    borderRadius: "12px",
    border: "none",
    background: "#15803d",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },

  sideCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
  },

  sideTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "16px",
  },

  sideList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  sideRow: {
    display: "grid",
    gridTemplateColumns: "24px 1fr auto",
    gap: "10px",
    alignItems: "center",
  },

  sideIcon: {
    fontSize: "14px",
  },

  sideLabel: {
    color: "#64748b",
    fontSize: "15px",
  },

  sideValue: {
    color: "#334155",
    fontSize: "15px",
    fontWeight: "500",
    textAlign: "right",
  },

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  timelineItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  darkCategoryBadge: {
  display: "inline-flex",
  backgroundColor: "#dcfce7",
  color: "#166534",
  padding: "6px 12px",
  borderRadius: "999px",
  fontWeight: "800",
  whiteSpace: "nowrap",
},
  timelineDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    backgroundColor: "#16a34a",
    marginTop: "6px",
    flexShrink: 0,
  },
  darkCard: {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
},

darkTitle: {
  color: "#f8fafc",
},

darkText: {
  color: "#f8fafc",
},

darkMutedText: {
  color: "#cbd5e1",
},
  timelineContent: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  timelineTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  darkCard: {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
},

darkTitle: {
  color: "#f8fafc",
},

darkText: {
  color: "#e5e7eb",
},

darkMutedText: {
  color: "#cbd5e1",
},
  timelineTitle: {
    fontSize: "15px",
    color: "#334155",
    fontWeight: "600",
  },

  timelineTime: {
    fontSize: "14px",
    color: "#64748b",
  },

  timelineDetails: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: 1.5,
  },

  timelineBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    backgroundColor: "#fef3c7",
    color: "#d97706",
    fontSize: "12px",
    fontWeight: "700",
  },

  badgePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
  },

  inlineCategory: {
    color: "#0f172a",
    fontWeight: "700",
  },

  inlineCategoryNoClass: {
    color: "#dc2626",
    fontWeight: "700",
  },

  message: {
    fontSize: "16px",
    color: "#334155",
  },

  error: {
    fontSize: "16px",
    color: "#dc2626",
  },
};

export default ComplaintDetailsPage;
