import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role (SuperAdmin or Admin)
  // Assuming role is populated in user object. If not, we might need to check role_id
  // Based on seed.py: SuperAdmin=1, Admin=2
  // But ideally we should check role name if available, or IDs.
  // The user object from /auth/me returns User schema which has role_id.
  // It also has 'role' relationship if eager loaded.
  // Let's check schemas/user.py. User schema inherits UserInDBBase which has role_id.
  // It doesn't seem to include the Role object by default in the Pydantic schema I wrote earlier.
  // Wait, `app/routers/auth.py` returns `UserSchema`.
  // `app/schemas/user.py`:
  // class User(UserInDBBase): pass
  // UserInDBBase has role_id.
  
  // I should probably update User schema to include Role details or just check IDs for now.
  // Let's assume 1 and 2 are admin roles for now based on seed.
  
  const isAdmin = user.role_id === 1 || user.role_id === 2;
  console.log("AdminRoute Check:", { user, role_id: user.role_id, isAdmin });

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
