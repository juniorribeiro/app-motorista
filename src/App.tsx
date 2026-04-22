import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Register from "./pages/Register";
import Dashboard from "@/pages/Dashboard";
import History from "@/pages/History";
import Reports from "@/pages/Reports";
import RegisterTrip from "@/pages/RegisterTrip";
import Settings from "@/pages/Settings";
import Costs from "@/pages/Costs";
import Profile from "@/pages/Profile";
import Diary from "@/pages/Diary";
import Import from "@/pages/Import";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register-user" element={<Register />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Dashboard />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/register-trip"
          element={
            isAuthenticated ? (
              <MainLayout>
                <RegisterTrip />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/history"
          element={
            isAuthenticated ? (
              <MainLayout>
                <History />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/reports"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Reports />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Settings />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/costs"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Costs />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Profile />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/diary"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Diary />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/import"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Import />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
