import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import Loading from "./components/common/Loading";

import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Every page used to be a static import, so the very first load shipped
// Login/Register/Dashboard/Farms JS to a visitor who only wanted the
// landing page (see FrontendAudit.md - "Performance Problems"). Each page
// is now its own chunk, fetched only when its route is visited. Layouts
// stay eager since they render on nearly every route anyway.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const MyFarmsPage = lazy(() => import("./features/farms/pages/MyFarmsPage"));
const AddFarmPage = lazy(() => import("./features/farms/pages/AddFarmPage"));
const EditFarmPage = lazy(() => import("./features/farms/pages/EditFarmPage"));
const FarmDetailsPage = lazy(() => import("./features/farms/pages/FarmDetailsPage"));

const WeatherPage = lazy(() => import("./features/weather/pages/WeatherPage"));

// Satellite Module - Sprint 2
// /dashboard/satellite lets a farmer pick a farm first;
// /dashboard/farms/:farmId/satellite is the direct, farm-scoped link
// used from FarmCard and FarmDetailsPage. Both render SatellitePage.
const SatellitePage = lazy(() => import("./features/satellite/pages/SatellitePage"));

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
          <Suspense fallback={<Loading />}>
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
                  <Route path="/dashboard/farms/:id" element={<FarmDetailsPage />} />
                  <Route path="/dashboard/farms/:id/edit" element={<EditFarmPage />} />

                  {/* Weather Module */}
                  <Route path="/dashboard/weather" element={<WeatherPage />} />
                  <Route path="/dashboard/farms/:farmId/weather" element={<WeatherPage />} />

                  {/* Satellite Module - Sprint 2 */}
                  <Route path="/dashboard/satellite" element={<SatellitePage />} />
                  <Route path="/dashboard/farms/:farmId/satellite" element={<SatellitePage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
