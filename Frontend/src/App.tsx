import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout
import DashboardLayout from "./layouts/DashboardLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import UploadPage from "./pages/Upload";
import Processing from "./pages/Processing";
import Results from "./pages/Results";
import History from "./pages/History";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes (No Sidebar) */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* 🔐 PROTECTED ROUTES (Sidebar is HERE) */}
          {/* This wrapper means: "Show DashboardLayout, and put the child page inside it" */}
          <Route element={<DashboardLayout />}>
            
            {/* Default to Upload if they go to /home or root of dashboard */}
            <Route path="/home" element={<Navigate to="/upload" replace />} />
            
            {/* The Actual Pages */}
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/results" element={<Results />} />
          </Route>

          {/* Fallback for 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;