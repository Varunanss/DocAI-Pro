import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  UploadCloud, 
  FileClock, 
  LogOut, 
  Menu,
  X,
  UserCircle,
  FileText,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Changed name for clarity
  const userEmail = localStorage.getItem('user_email') || "User";

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) navigate("/login");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Auto-close on mobile click
  };

  const menuItems = [
    { icon: UploadCloud, label: "New Analysis", path: "/upload" },
    { icon: FileClock, label: "History", path: "/history" },
  ];

  if (location.pathname === "/results") {
    menuItems.push({ 
        icon: Sparkles, 
        label: "Analysis Result", 
        path: "/results" 
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* ===========================
          MOBILE HEADER (Visible only on small screens)
      =========================== */}
      <header className="md:hidden bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-50">
          <div className="flex items-center gap-2" onClick={() => navigate("/upload")}>
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-lg text-slate-900">DocAI Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
      </header>

      {/* ===========================
          MOBILE OVERLAY (Backdrop)
      =========================== */}
      {/* This darkens the background when menu is open. Clicking it closes the menu. */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ===========================
          SIDEBAR (Responsive)
      =========================== */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-xl transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:relative md:shadow-none md:z-0
        `}
      >
        <div className="h-full flex flex-col">
          {/* DESKTOP LOGO (Hidden on mobile) */}
          <div className="hidden md:flex h-16 items-center px-6 border-b cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => navigate("/upload")}>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mr-3 shadow-sm">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">DocAI Pro</span>
          </div>

          {/* MENU ITEMS */}
          <nav className="flex-1 py-6 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-primary" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* USER PROFILE */}
          <div className="p-4 border-t bg-slate-50/50">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-2 border-white shadow-sm">
                            <UserCircle className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="overflow-hidden text-left flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">{userEmail.split('@')[0]}</p>
                            <p className="text-xs text-slate-500 truncate">Pro Plan</p>
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* ===========================
          MAIN CONTENT
      =========================== */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 relative">
        {/* Top bar description */}
        <header className="hidden md:flex h-16 bg-white border-b items-center justify-between px-8 sticky top-0 z-30">
            <h2 className="text-sm font-medium text-slate-500">
               {location.pathname === "/upload" && "Analysis / New Upload"}
               {location.pathname === "/history" && "Dashboard / History"}
               {location.pathname === "/processing" && "Analysis / Processing"}
               {location.pathname === "/results" && "Analysis / Results Report"}
            </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-500">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;