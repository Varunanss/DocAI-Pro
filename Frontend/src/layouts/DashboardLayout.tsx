import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, History, LogOut, FileText } from "lucide-react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Basic Auth Check: If no token, kick to login
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    // ✅ CLEAR EVERYTHING ON LOGOUT
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_processing_id");
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col fixed h-full z-10">
        
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">DocAI Pro</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-2">
            <Link to="/upload">
            <Button
                variant="ghost"
                className={`w-full justify-start gap-3 mb-1 ${
                isActive("/upload") || isActive("/processing") 
                    ? "bg-slate-800 text-blue-400" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
                <LayoutDashboard className="w-5 h-5" />
                New Analysis
            </Button>
            </Link>

            <Link to="/history">
            <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                isActive("/history") || isActive("/results")
                    ? "bg-slate-800 text-blue-400" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
                <History className="w-5 h-5" />
                History
            </Button>
            </Link>
        </nav>

        {/* Logout Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
            <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30"
            onClick={handleLogout}
            >
            <LogOut className="w-5 h-5" />
            Sign Out
            </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
             {/* This <Outlet /> is where Results, History, Upload pages appear */}
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;