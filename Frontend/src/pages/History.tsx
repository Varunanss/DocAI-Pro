import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { FileText, Calendar, ArrowRight, Loader2, Plus, LayoutDashboard, Trash2, RefreshCw } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true); 
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) { navigate("/login"); return; }

      // ✅ Fetch from correct endpoint
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This will delete the document permanently.")) return;

    setDeletingId(id);
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/api/history/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            setHistory(prev => prev.filter(item => item.id !== id));
            toast({ title: "Deleted", description: "Report removed successfully." });
        } else {
            toast({ title: "Error", description: "Could not delete report.", variant: "destructive" });
        }
    } catch (err) {
        console.error(err);
    } finally {
        setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Document History</h1>
                <p className="text-slate-500">View and manage your past AI analyses.</p>
            </div>
            
            <div className="flex gap-2">
                <Button variant="outline" onClick={fetchHistory} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button onClick={() => navigate("/upload")} className="shadow-lg">
                    <Plus className="w-4 h-4 mr-2" /> New Upload
                </Button>
            </div>
        </div>

        {/* Content */}
        <Card className="shadow-md border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-slate-500" />
                    Your Reports
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
                ) : history.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                        <h3 className="text-lg font-medium text-slate-900">No documents yet</h3>
                        <p className="mb-6">Upload a PDF to get started.</p>
                        <Button variant="outline" onClick={() => navigate("/upload")}>Upload First PDF</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="w-[300px]">Document Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Processed Date</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((doc, i) => (
                                <TableRow key={i} className="cursor-pointer hover:bg-slate-50 transition-colors group"
                                    onClick={() => {
                                        if(doc.id) {
                                            localStorage.setItem('current_processing_id', doc.id.toString());
                                            navigate("/results");
                                        }
                                    }}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-500" />
                                            </div>
                                            <span className="truncate max-w-[200px]" title={doc.documentTitle}>
                                                {doc.documentTitle}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize bg-slate-100 text-slate-600">
                                            {doc.documentType ? doc.documentType.replace('_', ' ') : 'General'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {doc.processedAt.split(' ')[0]}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${doc.confidence > 80 ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            <span className="font-medium text-slate-700">{doc.confidence}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5">
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => handleDelete(e, doc.id)}
                                                disabled={deletingId === doc.id}
                                            >
                                                {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
};

export default History;