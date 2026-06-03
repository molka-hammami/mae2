export async function fetchComplaints(user) {
  const params = new URLSearchParams();

  if (user?.role) params.set("role", user.role);
  if (user?.assignedCategory) {
    params.set("assigned_category", user.assignedCategory);
  }

  const query = params.toString();
  const response = await fetch(
    `http://127.0.0.1:8000/api/reclamations/${query ? `?${query}` : ""}`
  );

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des réclamations");
  }

  return response.json();
}

export async function fetchComplaintDetail(id) {
  const response = await fetch(`http://127.0.0.1:8000/api/reclamations/${id}/`);

  if (!response.ok) {
    throw new Error(`Erreur lors du chargement du détail (${response.status})`);
  }

  return response.json();
}
