import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Eye, EyeOff } from "lucide-react";
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
        description: "Please enter your registered email address first.",
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
    
    if (!email || !password) {
      toast({ title: "Validation Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!email.includes('@')) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Invalid Password", description: "Password must be at least 6 characters", variant: "destructive" });
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

      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_email', email);

        toast({
          title: isRegisterMode ? "Account created!" : "Welcome back!",
          description: isRegisterMode ? "Your account has been created successfully" : "You've been logged in successfully",
        });

        // Redirect to the new HOME Dashboard
        navigate("/upload");
      } else {
        throw new Error('No access token received');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: isRegisterMode ? "Registration failed" : "Login failed",
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: "destructive",
      });
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
              {isRegisterMode ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription className="mt-2">
              {isRegisterMode 
                ? "Join DocAI Pro to start analyzing documents" 
                : "Enter your credentials to access your dashboard"}
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
                autoComplete="email"
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
                    autoComplete={isRegisterMode ? "new-password" : "current-password"}
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                   ℹ️ Must be at least 6 characters long
                </p>
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
                  {isRegisterMode ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                isRegisterMode ? "Sign Up" : "Log In"
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-primary">Terms</span> and{" "}
            <span className="underline cursor-pointer hover:text-primary">Privacy Policy</span>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;