/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ArticleDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("itsm_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'ADMIN');
    }

    const fetchArticle = async () => {
      const token = localStorage.getItem("itsm_token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kb/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setArticle(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este artigo?")) return;
    
    const token = localStorage.getItem("itsm_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kb/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) router.push("/kb");
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="text-center p-12 text-foreground/50">Carregando artigo...</div>;
  }

  if (!article) {
    return <div className="text-center p-12 text-red-400">Artigo não encontrado.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-foreground/60 hover:text-primary-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Base de Conhecimento
      </button>

      <div className="glass-panel p-10 rounded-3xl border border-white/10 relative overflow-hidden">
        {/* Decorative background for header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-8">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-500/20 text-primary-400 border border-primary-500/20 inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {article.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{article.title}</h1>
              
              <div className="flex items-center gap-6 text-sm text-foreground/50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" /> {article.author?.name}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {format(new Date(article.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>

            {isAdmin && (
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            )}
          </div>

          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-headings:font-bold">
            {/* Split paragraphs by newline for basic rendering */}
            {article.content.split('\n').map((paragraph: string, idx: number) => (
              <p key={idx} className="min-h-[1.5rem] text-foreground/80 text-lg">{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
