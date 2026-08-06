import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";

import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import FarmWorkspaceLayout from "./layouts/FarmWorkspaceLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

import MyFarmsPage from "./features/farms/pages/MyFarmsPage";
import AddFarmPage from "./features/farms/pages/AddFarmPage";
import EditFarmPage from "./features/farms/pages/EditFarmPage";
import FarmDetailsPage from "./features/farms/pages/FarmDetailsPage";

import WeatherPage from "./features/weather/pages/WeatherPage";
import SatellitePage from "./features/satellite/pages/SatellitePage";
import AdvisoryPage from "./features/ai/pages/AdvisoryPage";
import AnalyticsPage from "./features/analytics/pages/AnalyticsPage";
import ReportsPage from "./features/reports/pages/ReportsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public marketing pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth pages - only visible when logged out */}
            <Route element={<PublicOnlyRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Route>

            {/* Authenticated app */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Sprint 1: Farm Management */}
                <Route path="/dashboard/farms" element={<MyFarmsPage />} />
                <Route path="/dashboard/farms/new" element={<AddFarmPage />} />
                <Route path="/dashboard/farms/:id/edit" element={<EditFarmPage />} />

                {/* Per-farm workspace: Overview, Weather, Satellite, AI Advisory, Analytics, Reports */}
                <Route path="/dashboard/farms/:id" element={<FarmWorkspaceLayout />}>
                  <Route index element={<FarmDetailsPage />} />
                  <Route path="weather" element={<WeatherPage />} />
                  <Route path="satellite" element={<SatellitePage />} />
                  <Route path="advisory" element={<AdvisoryPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Route>

                <Route path="/dashboard/profile" element={<ProfilePage />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
