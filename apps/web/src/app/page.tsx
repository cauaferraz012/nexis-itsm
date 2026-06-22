/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Search, Plus, FileText, CheckCircle2, Clock } from "lucide-react";
import { NewTicketModal } from "@/components/NewTicketModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const router = useRouter();

  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'USER'>('USER');
  const [userName, setUserName] = useState('');

  const fetchTickets = async () => {
    const token = localStorage.getItem("itsm_token");
    const userStr = localStorage.getItem("itsm_user");
    if (!token) {
      router.push("/login");
      return;
    }
    
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUserRole(parsedUser.role);
      setUserName(parsedUser.name.split(' ')[0]); // Pega apenas o primeiro nome
    }

    // Adiciona um tempo mínimo de 5s para a tela de carregamento aparecer bonitinha
    await new Promise(resolve => setTimeout(resolve, 5000));

    setIsAuthChecked(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("itsm_token");
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Erro ao buscar tickets", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [router]);

  if (!isAuthChecked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
          NEXIS
        </h1>
        <div className="mt-8">
          <div className="w-8 h-8 rounded-full border-[3px] border-primary-500/20 border-r-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  const handleTicketCreated = () => {
    fetchTickets(); // Refresh the list
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <NewTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleTicketCreated} 
      />

      {/* Header section with search */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          {userRole === 'ADMIN' ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 tracking-wider">PORTAL DE TI (ADMIN)</span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30 tracking-wider">PORTAL DO COLABORADOR</span>
          )}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Olá, {userName || 'Usuário'}</h1>
        <p className="text-foreground/60 text-lg">Como podemos ajudar você hoje?</p>
        
        <div className="relative max-w-2xl mt-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-foreground/40" />
          </div>
          <input
            type="text"
            className="w-full glass-panel h-16 rounded-2xl pl-14 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow bg-surface-hover/50"
            placeholder="Descreva seu problema ou busque um artigo..."
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard 
          delay={0.1} 
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer hover:-translate-y-1 transition-transform border-primary-500/30"
        >
          <div className="h-12 w-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-4 text-primary-500">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Novo Chamado</h3>
          <p className="text-sm text-foreground/60">Reporte um incidente ou faça uma solicitação de TI.</p>
        </GlassCard>

        <GlassCard 
          delay={0.2} 
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer hover:-translate-y-1 transition-transform border-purple-500/30"
        >
          <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Solicitar Acesso</h3>
          <p className="text-sm text-foreground/60">Acessos a sistemas, VPN, pastas de rede e mais.</p>
        </GlassCard>
      </section>

      {/* Summary section */}
      <section className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Meus Chamados Recentes</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Clock className="w-3 h-3" />
              {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
            </button>
            <button className="text-primary-500 hover:text-primary-400 text-sm font-medium ml-2">Ver todos</button>
          </div>
        </div>

        {/* Filtro de Categoria (Pílulas) */}
        <div className="flex overflow-x-auto pb-4 mb-2 gap-2 hide-scrollbar">
          {['ALL', 'HARDWARE', 'SOFTWARE', 'NETWORK', 'ACESSOS', 'OUTROS'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === cat ? 'bg-primary-500 text-white' : 'bg-white/5 border border-white/10 text-foreground/60 hover:text-foreground hover:border-white/20'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat === 'NETWORK' ? 'Rede' : cat === 'SOFTWARE' ? 'Software' : cat === 'HARDWARE' ? 'Hardware' : cat === 'ACESSOS' ? 'Acessos' : 'Outros'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-foreground/50">Carregando chamados...</p>
          ) : tickets.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-foreground/50">Nenhum chamado aberto ainda. Você está com tudo em ordem!</p>
            </GlassCard>
          ) : (
            tickets
              .filter(t => activeTab === 'ALL' || t.category === activeTab)
              .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
              })
              .map((ticket, i) => (
              <GlassCard 
                key={ticket.id} 
                delay={0.3 + i * 0.1} 
                onClick={() => router.push(`/tickets/${ticket.id}`)}
                className="flex items-center justify-between p-4 group cursor-pointer hover:border-primary-500/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${
                    ticket.status === 'RESOLVED' ? 'bg-green-500/10 border-green-500/20 text-green-400 group-hover:bg-green-500/20' : 
                    ticket.status === 'WAITING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500/20' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20' :
                    'bg-white/5 border-white/10 text-white/70 group-hover:bg-white/10'
                  }`}>
                    {ticket.status === 'RESOLVED' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground group-hover:text-primary-400 transition-colors">{ticket.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-foreground/50 font-mono">#{ticket.id.split('-')[0]}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${ticket.type === 'REQUEST' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ticket.type === 'REQUEST' ? 'Requerimento' : 'Incidente'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    ticket.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' :
                    ticket.status === 'WAITING' ? 'bg-yellow-500/20 text-yellow-400' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-foreground/80'
                  }`}>
                    {ticket.status === 'RESOLVED' ? 'Resolvido' : ticket.status === 'WAITING' ? 'Aguardando' : ticket.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Aberto'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    ticket.priority === 'URGENT' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                    ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-black/20 text-foreground/50'
                  }`}>
                    {ticket.priority === 'URGENT' ? 'URGENTE' : ticket.priority === 'HIGH' ? 'ALTA' : ticket.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                  </span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
