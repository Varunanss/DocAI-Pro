import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle, Circle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Processing = () => {
  const navigate = useNavigate();
  
  // Animation State: 0=Identifying, 1=Summarizing, 2=Auditing
  const [currentAnimStep, setCurrentAnimStep] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  
  // Backend Status (Polled)
  const [isBackendDone, setIsBackendDone] = useState(false);

  // Random Durations (Calculated once on mount)
  const step1Duration = useRef(Math.floor(Math.random() * (5000 - 2000 + 1) + 2000)); 
  const step2Duration = useRef(Math.floor(Math.random() * (15000 - 10000 + 1) + 5000)); 

  useEffect(() => {
    const processFlow = async () => {
      setStatusText("identifying");
      setCurrentAnimStep(0);
      await new Promise(resolve => setTimeout(resolve, step1Duration.current));
      setStatusText("summarizing");
      setCurrentAnimStep(1);
      await new Promise(resolve => setTimeout(resolve, step2Duration.current));
      setStatusText("auditing");
      setCurrentAnimStep(2);
      const checkBackend = setInterval(async () => {
        const isDone = await checkBackendStatus();
        if (isDone) {
            clearInterval(checkBackend);
            setIsBackendDone(true);
            setTimeout(() => {
                navigate("/results");
            }, 1000);
        }
      }, 1000);
    };

    processFlow();
  }, [navigate]);

  const checkBackendStatus = async () => {
    try {
      const processingId = localStorage.getItem('current_processing_id');
      const token = localStorage.getItem('auth_token');
      if (!processingId) return false;

      const response = await fetch(`${API_BASE_URL}/api/processing/${processingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      // We only care if it's fully SUCCESS
      return result.status === "success";
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const steps = [
    { id: "identifying", label: "Opening Document" },
    { id: "summarizing", label: "Reading the Document" },
    { id: "auditing", label: "Summarizing the Document" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center pb-2">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-2 animate-pulse" />
              <CardTitle className="text-xl">AI Analysis in Progress</CardTitle>
              <CardDescription>
                  Please wait while we process your document...
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
              {steps.map((step, idx) => {
                  let icon = <Circle className="w-6 h-6 text-muted-foreground/30" />;
                  let lineColor = 'bg-muted';
                  let textColor = 'text-muted-foreground';

                  if (currentAnimStep > idx) {
                      icon = <CheckCircle className="w-6 h-6 text-green-500 transition-all duration-300 scale-110" />;
                      lineColor = 'bg-green-500';
                      textColor = 'text-foreground font-medium';
                  } else if (currentAnimStep === idx) {
                      if (idx === 2 && isBackendDone) {
                           icon = <CheckCircle className="w-6 h-6 text-green-500 scale-110" />;
                           textColor = 'text-foreground font-medium';
                      } else {
                           icon = <Loader2 className="w-6 h-6 text-primary animate-spin" />;
                           textColor = 'text-primary font-bold';
                      }
                  }

                  return (
                      <div key={step.id} className="flex items-center gap-4 transition-all duration-300">
                          <div className="relative flex items-center justify-center">
                              {icon}
                              {/* Vertical Line */}
                              {idx !== steps.length - 1 && (
                                  <div className={`absolute top-6 left-3 w-[2px] h-6 transition-colors duration-500 ${lineColor}`} />
                              )}
                          </div>
                          <div className={`text-sm ${textColor}`}>
                              {step.label}
                          </div>
                      </div>
                  );
              })}
          </CardContent>
      </Card>

    </div>
  );
};

export default Processing;