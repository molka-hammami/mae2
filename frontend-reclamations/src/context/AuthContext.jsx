import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

const API_BASE = "http://127.0.0.1:8000/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("current_user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("current_user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      }
    }

    setLoadingAuth(false);
  }, []);

  const normalizeUser = (apiUser) => ({
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    personalEmail: apiUser.personal_email || "",
    role: apiUser.role?.trim().toUpperCase(),
    mustChangePassword: apiUser.must_change_password,
    assignedCategory: apiUser.assigned_category || null,
    isActive: apiUser.is_active,
  });

  const isStrongPassword = (password) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    return strongPasswordRegex.test(password);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const login = async ({ email, password }) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error("Email et mot de passe sont obligatoires.");
    }

    const response = await fetch(`${API_BASE}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Email ou mot de passe incorrect.");
    }

    const apiUser = data.user || data;
    const loggedUser = normalizeUser(apiUser);

    setUser(loggedUser);
    localStorage.setItem("current_user", JSON.stringify(loggedUser));

    if (data.access) {
      localStorage.setItem("access_token", data.access);
    }

    if (data.refresh) {
      localStorage.setItem("refresh_token", data.refresh);
    }

    return loggedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("current_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  const changePassword = async ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    if (!user) {
      throw new Error("Utilisateur non connecté.");
    }

    if (
      !currentPassword?.trim() ||
      !newPassword?.trim() ||
      !confirmPassword?.trim()
    ) {
      throw new Error("Tous les champs sont obligatoires.");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("La confirmation du mot de passe est incorrecte.");
    }

    if (currentPassword === newPassword) {
      throw new Error("Le nouveau mot de passe doit être différent de l'ancien.");
    }

    if (!isStrongPassword(newPassword)) {
      throw new Error(
        "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
      );
    }

    const response = await fetch(`${API_BASE}/change-password/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id: user.id,
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error || "Erreur lors du changement du mot de passe."
      );
    }

    const updatedCurrentUser = normalizeUser(data);

    setUser(updatedCurrentUser);
    localStorage.setItem("current_user", JSON.stringify(updatedCurrentUser));

    return updatedCurrentUser;
  };

  const fetchUsers = async () => {
    const response = await fetch(`${API_BASE}/users/`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Erreur lors du chargement des utilisateurs.");
    }

    const normalizedUsers = data.map(normalizeUser);
    setUsers(normalizedUsers);
    return normalizedUsers;
  };

  const createUser = async ({
    name,
    email,
    password,
    role = "AGENT",
    assignedCategory = null,
    isActive = true,
  }) => {
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      throw new Error("Nom, email et mot de passe sont obligatoires.");
    }

    const personalEmail = email.trim().toLowerCase();
    const username = personalEmail.split("@")[0];
    const generatedLogin = `${username}@mae.tn`;

    const response = await fetch(`${API_BASE}/users/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: name.trim(),
        email: generatedLogin,
        personal_email: personalEmail,
        password: password.trim(),
        role,
        assigned_category: role === "AGENT" ? assignedCategory : null,
        is_active: isActive,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.email?.[0] ||
          data?.personal_email?.[0] ||
          data?.name?.[0] ||
          "Erreur lors de la création de l'utilisateur."
      );
    }

    const createdUser = normalizeUser(data);
    setUsers((prev) => [...prev, createdUser]);
    return createdUser;
  };

  const updateUser = async (userId, updatedData) => {
    const payload = { ...updatedData };

    if ("email" in payload && payload.email) {
      payload.email = payload.email.trim().toLowerCase();
    }

    if ("personalEmail" in payload) {
      payload.personal_email = payload.personalEmail;
      delete payload.personalEmail;
    }

    if ("name" in payload && payload.name) {
      payload.name = payload.name.trim();
    }

    if ("assignedCategory" in payload) {
      payload.assigned_category = payload.assignedCategory;
      delete payload.assignedCategory;
    }

    if ("isActive" in payload) {
      payload.is_active = payload.isActive;
      delete payload.isActive;
    }

    const response = await fetch(`${API_BASE}/users/${userId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.email?.[0] ||
          data?.personal_email?.[0] ||
          data?.name?.[0] ||
          "Erreur lors de la modification de l'utilisateur."
      );
    }

    const updatedUser = normalizeUser(data);

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? updatedUser : u))
    );

    if (user && user.id === userId) {
      setUser(updatedUser);
      localStorage.setItem("current_user", JSON.stringify(updatedUser));
    }

    return updatedUser;
  };

  const deleteUser = async (userId) => {
    const response = await fetch(`${API_BASE}/users/${userId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      throw new Error(data?.error || "Erreur lors de la suppression.");
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (user && user.id === userId) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        setUsers,
        login,
        logout,
        changePassword,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        isAuthenticated: !!user,
        loadingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}