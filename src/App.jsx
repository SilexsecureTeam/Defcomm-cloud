import { Suspense, lazy, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { SpeedInsights } from '@vercel/speed-insights/react';
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import FallBack from "./components/Fallback";
import { DashboardContextProvider } from "./context/DashboardContext";
import { queryClient } from "./services/query-client";
import { ChatProvider } from "./context/ChatContext";
import { MeetingProvider } from "./context/MeetingContext";
import { BotProvider } from "./context/BotContext";
import { NotificationProvider } from "./context/NotificationContext";
// 🔒 Secure Access Guard
import SecureAccessGuard from "./routes/security/SecureAccessGuard";

// Lazy load components
const DefcommLogin = lazy(() => import("./pages/DefcommLogin"));
const UserVerification = lazy(() => import("./pages/UserVerification"));
const Dashboard = lazy(() => import("./routes/DashboardRoutes"));
const DeffViewer = lazy(() => import("./pages/DeffViewer"));
const SecureChatUI = lazy(() => import("./pages/SecureChatUI"));
const ChatInterface = lazy(() => import("./pages/ChatInterface"));
const SecureRoute = lazy(() => import("./routes/SecureRoute"));

const App = () => {
  return (
    //<SecureAccessGuard>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <BotProvider>
              <DashboardContextProvider>
                <Router>
                  <Suspense fallback={<FallBack />}>
                    <Routes>
                      <Route path="/login" element={<DefcommLogin />} />
                      <Route
                        path="/onboarding"
                        element={<UserVerification />}
                      />
                      <Route path="/" element={<DefcommLogin />} />
                      <Route path="web" element={<DeffViewer />} />

                      {/* Using ProtectedRoute as a Component for dashboard */}
                      <Route path="/dashboard/*" element={<SecureRoute />}>
                        <Route
                          path="*"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                      </Route>

                      {/* Catch-all redirect */}
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Suspense>
                </Router>
                <ToastContainer
                  autoClose={2000}
                  draggable
                  className="z-[100000000000] mt-2"
                />
                <SpeedInsights />
              </DashboardContextProvider>
            </BotProvider>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>

      {/* {import.meta.env.VITE_MODE === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="right" />
      )} */}
    </QueryClientProvider>
    //</SecureAccessGuard>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { authDetails, isLoading } = useContext(AuthContext);

  if (isLoading)
    return <div className="text-white text-center mt-10">Loading...</div>;

  if (!authDetails || authDetails.user?.role !== "user") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default App;
