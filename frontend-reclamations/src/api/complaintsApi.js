export async function fetchComplaints() {
  const response = await fetch("http://127.0.0.1:8000/api/reclamations/");

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