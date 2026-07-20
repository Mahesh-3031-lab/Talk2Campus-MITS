import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import { useRealtimeUpdates } from "./hooks/useRealtimeUpdates";

const queryClient = new QueryClient();

function AppRoutes() {
  useRealtimeUpdates();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/chat" element={<ChatInterface />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="/canteen" element={<CanteenPage />} />
      <Route path="/canteen/vendor" element={<VendorDashboardPage />} />
      <Route path="/updates" element={<UpdatesPage />} />
      <Route path="/timetable" element={<TimetablePage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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
