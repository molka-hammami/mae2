import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    return <p>Chargement...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;