"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Book, FileText, Plus, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NewArticleModal } from "@/components/NewArticleModal";

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchArticles = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("itsm_token");
    try {
      const url = new URL("http://localhost:3001/kb");
      if (searchQuery) url.searchParams.append("q", searchQuery);

      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setArticles(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("itsm_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'ADMIN');
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchArticles();
    }, 500); // Debounce search
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const categories = Array.from(new Set(articles.map(a => a.category)));

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="text-center space-y-6 py-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary-500/20 text-primary-400 mb-2">
          <Book className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Como podemos ajudar?</h1>
        <p className="text-foreground/60 max-w-2xl mx-auto text-lg">
          Pesquise em nossa base de conhecimento por tutoriais, resoluções de problemas comuns e manuais.
        </p>

        <div className="max-w-2xl mx-auto relative mt-8">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ex: Como configurar a VPN, Instalar impressora..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-lg"
          />
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-5 h-5" /> Novo Artigo
          </button>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-foreground/50">Buscando na base de conhecimento...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-3xl border border-white/5 border-dashed">
          <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground/60">Nenhum artigo encontrado.</h3>
          <p className="text-foreground/40 mt-2">Tente buscar por termos diferentes ou abra um chamado.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {categories.map(category => (
            <div key={category} className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-2 h-6 bg-primary-500 rounded-full inline-block"></span>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.filter(a => a.category === category).map(article => (
                  <div
                    key={article.id}
                    onClick={() => router.push(`/kb/${article.id}`)}
                    className="glass-panel p-5 rounded-2xl border border-white/10 hover:-translate-y-1 hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors flex justify-between items-start">
                      {article.title}
                      <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-primary-500" />
                    </h3>
                    <p className="text-sm text-foreground/50 line-clamp-2 mb-4">
                      {article.content}
                    </p>
                    <div className="text-xs text-foreground/40 font-medium">
                      Por {article.author?.name} • {format(new Date(article.createdAt), "dd MMM yyyy", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewArticleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchArticles}
      />
    </div>
  );
}
