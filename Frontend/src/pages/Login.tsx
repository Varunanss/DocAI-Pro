import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const isRegisterMode = activeTab === "register";

  const handleForgotPassword = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Email Required",
        description: "Please enter your email to reset the password.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Check your inbox",
      description: `We've sent a password reset link to ${email}.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDATION ---
    if (!email || !password) {
      toast({ title: "Validation Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!email.includes('@')) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // --- 🧠 SMART ERROR HANDLING ---
      if (!response.ok) {
        // CASE 1: User tries to Login, but account doesn't exist (404)
        if (response.status === 404 && !isRegisterMode) {
            toast({ 
                title: "Account Not Found", 
                description: "You don't have an account yet. Please Sign Up.", 
                variant: "destructive" 
            });
            setActiveTab("register"); // 👈 Auto-switch to Register tab
            throw new Error("Switching to register..."); // Stop execution
        }

        // CASE 2: Wrong Password (401)
        if (response.status === 401) {
            toast({ 
                title: "Incorrect Password", 
                description: "The password you entered is incorrect. Try again.", 
                variant: "destructive" 
            });
            throw new Error("Wrong password");
        }

        // CASE 3: User tries to Register, but email already exists (400)
        if (response.status === 400 && isRegisterMode) {
            toast({ 
                title: "Account Already Exists", 
                description: "This email is already registered. Please Log In.", 
                variant: "default" // Not destructive, just informative
            });
            setActiveTab("login"); // 👈 Auto-switch to Login tab
            throw new Error("Switching to login...");
        }

        // General Error (Server error, etc.)
        throw new Error(data.detail || 'Authentication failed');
      }

      // --- SUCCESS ---
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_email', email);
        
        // 🧹 Clear old analysis ID so Dashboard is fresh
        localStorage.removeItem('current_processing_id');

        toast({
          title: isRegisterMode ? "Welcome to DocAI Pro!" : "Welcome back!",
          description: isRegisterMode ? "Your account has been created successfully." : "Login successful.",
          className: "bg-green-50 border-green-200 text-green-900",
        });

        navigate("/upload");
      }

    } catch (error: any) {
      // Don't log expected flow interruptions (like tab switching)
      if (error.message !== "Switching to register..." && error.message !== "Switching to login..." && error.message !== "Wrong password") {
          console.error('Auth error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-subtle">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md animate-slide-up relative overflow-hidden shadow-2xl border-primary/10">
        {/* Tab Switcher */}
        <div className="flex w-full border-b bg-muted/20">
            <button
                type="button"
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'login' 
                    ? 'border-b-2 border-primary text-primary bg-white shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => setActiveTab('login')}
            >
                Log In
            </button>
            <button
                type="button"
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'register' 
                    ? 'border-b-2 border-primary text-primary bg-white shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => setActiveTab('register')}
            >
                Sign Up
            </button>
        </div>

        <CardHeader className="text-center space-y-4 pt-8">
          <div className="mx-auto w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <FileText className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isRegisterMode ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="mt-2">
              {isRegisterMode 
                ? "Sign up to start analyzing documents instantly." 
                : "Enter your credentials to continue."}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {!isRegisterMode && (
                   <button 
                     type="button"
                     onClick={handleForgotPassword}
                     className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                   >
                     Forgot Password?
                   </button>
                )}
              </div>
              
              <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
              </div>
              {isRegisterMode && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                   <AlertCircle className="w-3 h-3" />
                   <span>Password must be at least 6 characters</span>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="w-full mt-2 font-semibold shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                isRegisterMode ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-primary">Terms</span> &{" "}
            <span className="underline cursor-pointer hover:text-primary">Privacy Policy</span>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;