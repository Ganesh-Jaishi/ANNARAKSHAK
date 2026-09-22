/**
 * ANNARAKSHAK — App Router
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Institution pages
import InstitutionDashboard from './pages/institution/Dashboard';
import RegisterFood from './pages/institution/RegisterFood';
import InstitutionAllocations from './pages/institution/Allocations';
import InstitutionTrackDelivery from './pages/institution/TrackDelivery';
import WasteIntelligence from './pages/institution/WasteIntelligence';

// Receiver pages
import ReceiverDashboard from './pages/receiver/Dashboard';
import ReceiverAllocations from './pages/receiver/Allocations';
import ReceiverTrackDelivery from './pages/receiver/TrackDelivery';
import ReceiverHistory from './pages/receiver/History';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import HeatMap from './pages/admin/HeatMap';
import AdminInstitutions from './pages/admin/Institutions';
import Analytics from './pages/admin/Analytics';
import ESGReports from './pages/admin/ESGReports';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <Register />} />

      {/* Institution */}
      <Route path="/institution" element={<ProtectedRoute role="institution"><Layout /></ProtectedRoute>}>
        <Route index element={<InstitutionDashboard />} />
        <Route path="register-food" element={<RegisterFood />} />
        <Route path="allocations" element={<InstitutionAllocations />} />
        <Route path="track" element={<InstitutionTrackDelivery />} />
        <Route path="waste" element={<WasteIntelligence />} />
      </Route>

      {/* Receiver */}
      <Route path="/receiver" element={<ProtectedRoute role="receiver"><Layout /></ProtectedRoute>}>
        <Route index element={<ReceiverDashboard />} />
        <Route path="allocations" element={<ReceiverAllocations />} />
        <Route path="track" element={<ReceiverTrackDelivery />} />
        <Route path="history" element={<ReceiverHistory />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="heatmap" element={<HeatMap />} />
        <Route path="institutions" element={<AdminInstitutions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="esg" element={<ESGReports />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
