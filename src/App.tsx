import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import ChatInterface from "./pages/ChatInterface";
import AttendancePage from "./pages/AttendancePage";
import CanteenPage from "./pages/CanteenPage";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import UpdatesPage from "./pages/UpdatesPage";
import TimetablePage from "./pages/TimetablePage";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import NotificationOptIn from "./components/NotificationOptIn";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useRealtimeUpdates } from "./hooks/useRealtimeUpdates";

const StudentHome = lazy(() => import("./pages/StudentHome"));
const ParentHome = lazy(() => import("./pages/ParentHome"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

const queryClient = new QueryClient();

const RouteFallback = () => <div className="min-h-screen" />;

function AppRoutes() {
  useRealtimeUpdates();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
        <Route path="/student" element={<ErrorBoundary><StudentHome /></ErrorBoundary>} />
        <Route path="/parent" element={<ErrorBoundary><ParentHome /></ErrorBoundary>} />
        <Route path="/chat" element={<ErrorBoundary><ChatInterface /></ErrorBoundary>} />
        <Route path="/attendance" element={<ErrorBoundary><AttendancePage /></ErrorBoundary>} />
        <Route path="/canteen" element={<ErrorBoundary><CanteenPage /></ErrorBoundary>} />
        <Route path="/canteen/vendor" element={<ErrorBoundary><VendorDashboardPage /></ErrorBoundary>} />
        <Route path="/updates" element={<ErrorBoundary><UpdatesPage /></ErrorBoundary>} />
        <Route path="/timetable" element={<ErrorBoundary><TimetablePage /></ErrorBoundary>} />
        <Route path="/.lovable/oauth/consent" element={<ErrorBoundary><OAuthConsent /></ErrorBoundary>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <NotificationOptIn />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
