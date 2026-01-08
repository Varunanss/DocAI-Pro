import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // 👈 THIS WAS MISSING
import { Sparkles, FileText, Download, ArrowLeft, Loader2, Calendar } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const processingId = localStorage.getItem('current_processing_id');
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate("/login");
            return;
        }

        // 🧠 LOGIC CHECK 2: Logged in, but no file uploaded? -> Go to History
        if (!processingId) {
            navigate("/history");
            return;
        }
        
        if (!processingId || !token) {
            navigate("/upload");
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/processing/${processingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Failed to load results");
        
        const result = await response.json();
        
        // If the AI is still processing, send back to animation page
        if (result.status !== "success" && result.status !== "failed") {
            navigate("/processing");
            return;
        }
        
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        navigate("/upload");
      }
    };

    fetchData();
  }, [navigate]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const processingId = localStorage.getItem('current_processing_id');
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/reports/${processingId}/download`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocAI_Report_${processingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: "Report downloaded." });
    } catch (e) {
      toast({ title: "Error", description: "Download failed.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-fade-in">
      
      {/* Header with Back Button & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/history")} className="pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4"/> Back to History
          </Button>
          
          <div className="flex gap-3">
              <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2">
                <span className="text-sm text-slate-500">Confidence:</span>
                <span className={`text-lg font-bold ${data.confidence > 80 ? 'text-green-600' : 'text-amber-500'}`}>
                    {data.confidence}%
                </span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-slate-400" />
                 <span className="text-sm font-medium">{data.processedAt.split(' ')[0]}</span>
              </div>
          </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          {/* LEFT COL: Metadata & Entities */}
          <div className="md:col-span-1 space-y-6">
              <Card className="shadow-md border-slate-200">
                <CardHeader className="bg-slate-50/50 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> 
                        File Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Filename</p>
                        <p className="text-sm font-medium truncate" title={data.documentTitle}>{data.documentTitle}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Detected Type</p>
                        <Badge variant="outline" className="mt-1 capitalize">{data.documentType}</Badge>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pages</p>
                        <p className="text-sm font-medium">{data.pages}</p>
                    </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-slate-200">
                <CardHeader className="bg-slate-50/50 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" /> 
                        Extracted Data
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid gap-3">
                    {data.extractedFields && data.extractedFields.map((field: any, i: number) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-md border border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 mb-1">{field.label}</p>
                            <p className="text-sm text-slate-900 break-words">{field.value}</p>
                        </div>
                    ))}
                </CardContent>
              </Card>
          </div>

          {/* RIGHT COL: Summary & Download */}
          <div className="md:col-span-2 space-y-6">
             <Card className="shadow-lg border-primary/20 h-full">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                    <CardTitle className="flex gap-2 items-center text-xl">
                        <Sparkles className="w-5 h-5 text-primary" /> AI Analysis Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 prose prose-slate max-w-none">
                     <ReactMarkdown 
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4 border-b pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 text-slate-700" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 text-slate-700 leading-relaxed" {...props} />
                        }}
                     >
                        {data.summary}
                    </ReactMarkdown>
                </CardContent>
            </Card>
            
            <Button size="lg" className="w-full shadow-lg h-14 text-lg" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Download className="mr-2 h-5 w-5"/>}
                Download Professional PDF Report
            </Button>
          </div>
      </div>
    </div>
  );
};
export default Results;