import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, File, X, Loader2, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "PDFs only please!", variant: "destructive" });
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max size is 10MB", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    const token = localStorage.getItem('auth_token');
    if (!token) { navigate("/login"); return; }

    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        localStorage.setItem('current_processing_id', response.processing_id);
        toast({ title: "Upload Successful", description: "Starting AI Analysis..." });
        navigate("/processing"); 
      } else {
        toast({ title: "Upload Failed", description: "Server error.", variant: "destructive" });
        setIsUploading(false);
      }
    });

    xhr.addEventListener('error', () => {
      toast({ title: "Network Error", description: "Check connection.", variant: "destructive" });
      setIsUploading(false);
    });

    xhr.open('POST', `${API_BASE_URL}/api/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">


       <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Document</h1>
            <p className="text-slate-500">Upload a PDF to start a new analysis session.</p>
          </div>
       </div>

        <Card className="shadow-xl border-primary/20">
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>Supported format: PDF (Max 10MB)</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                ${isDragging ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"}
                ${file ? "bg-slate-50 border-solid border-primary/20" : ""}
              `}
            >
              {!file ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium mb-1">Drag & Drop your PDF here</p>
                  <p className="text-sm text-slate-400 mb-6">or click to browse from your computer</p>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Button variant="outline">Browse Files</Button>
                </>
              ) : (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <File className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isUploading} className="text-slate-400 hover:text-red-600">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
            
            {isUploading && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{uploadProgress < 100 ? 'Uploading to Secure Server...' : 'Initializing AI...'}</span>
                  <span className="font-bold text-slate-900">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <Button variant="gradient" size="lg" className="w-full h-12 text-base shadow-lg shadow-primary/20" onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? <><Loader2 className="animate-spin mr-2" /> Processing...</> : <><Upload className="w-5 h-5 mr-2" /> Start Analysis</>}
            </Button>
          </CardContent>
        </Card>
    </div>
  );
};

export default UploadPage;