/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { CheckCircle2, Clock, Search, Filter } from "lucide-react";

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem("itsm_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets", {
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

    fetchTickets();
  }, [router]);

  const [activeTab, setActiveTab] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredTickets = tickets.filter(t => {
    if (activeTab !== 'ALL' && t.status !== activeTab) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Meus Chamados</h1>
          <p className="text-foreground/60 text-lg">Acompanhe e gerencie todas as suas solicitações.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex bg-black/40 p-1 rounded-xl w-full overflow-x-auto">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'OPEN', label: 'Abertos' },
              { id: 'IN_PROGRESS', label: 'Em Atendimento' },
              { id: 'WAITING', label: 'Pendentes' },
              { id: 'RESOLVED', label: 'Resolvidos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-foreground/50 hover:text-foreground/80 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Filtro de Categoria (Pílulas) */}
          <div className="flex overflow-x-auto gap-2 hide-scrollbar w-full sm:w-auto">
            {['ALL', 'HARDWARE', 'SOFTWARE', 'NETWORK', 'ACESSOS', 'OUTROS'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  categoryFilter === cat ? 'bg-primary-500 text-white' : 'bg-white/5 border border-white/10 text-foreground/60 hover:text-foreground hover:border-white/20'
                }`}
              >
                {cat === 'ALL' ? 'Todas as Categorias' : cat === 'NETWORK' ? 'Rede' : cat === 'SOFTWARE' ? 'Software' : cat === 'HARDWARE' ? 'Hardware' : cat === 'ACESSOS' ? 'Acessos' : 'Outros'}
              </button>
            ))}
          </div>
          
          {/* Ordenação */}
          <button 
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Clock className="w-3 h-3" />
            {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Requerimentos */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-blue-500/10 text-blue-400">
            <span className="text-lg font-bold">🔵 Requerimentos</span>
            <span className="text-sm font-semibold bg-blue-500/20 px-2 py-0.5 rounded-full">{filteredTickets.filter(t => t.type === 'REQUEST').length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs text-foreground/70 uppercase tracking-wider">
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">ID / Título</th>
                  <th className="p-3 font-medium">Resp.</th>
                  <th className="p-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-foreground/50">Carregando...</td>
                  </tr>
                ) : filteredTickets.filter(t => t.type === 'REQUEST').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-foreground/50">Nenhum requerimento encontrado.</td>
                  </tr>
                ) : (
                  filteredTickets.filter(t => t.type === 'REQUEST').map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <td className="p-3">
                        {ticket.status === 'RESOLVED' ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Fechado</span>
                        ) : ticket.status === 'OPEN' ? (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium"><Clock className="w-3 h-3" /> Aberto</span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-400 text-xs font-medium"><Clock className="w-3 h-3" /> Atendendo</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary-400 transition-colors truncate max-w-[150px]" title={ticket.title}>{ticket.title}</p>
                        <p className="text-[10px] text-foreground/50 font-mono mt-0.5">#{ticket.id.split('-')[0]}</p>
                      </td>
                      <td className="p-3">
                        {ticket.assignee ? (
                          <span className="text-xs text-primary-400 font-medium truncate max-w-[80px] block">{ticket.assignee.name.split(' ')[0]}</span>
                        ) : (
                          <span className="text-[10px] text-foreground/40 italic">Aguardando</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-foreground/70 whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incidentes */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-red-500/10 text-red-400">
            <span className="text-lg font-bold">🔴 Incidentes</span>
            <span className="text-sm font-semibold bg-red-500/20 px-2 py-0.5 rounded-full">{filteredTickets.filter(t => t.type === 'INCIDENT').length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs text-foreground/70 uppercase tracking-wider">
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">ID / Título</th>
                  <th className="p-3 font-medium">Resp.</th>
                  <th className="p-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-foreground/50">Carregando...</td>
                  </tr>
                ) : filteredTickets.filter(t => t.type === 'INCIDENT').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-foreground/50">Nenhum incidente encontrado.</td>
                  </tr>
                ) : (
                  filteredTickets.filter(t => t.type === 'INCIDENT').map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <td className="p-3">
                        {ticket.status === 'RESOLVED' ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Fechado</span>
                        ) : ticket.status === 'OPEN' ? (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium"><Clock className="w-3 h-3" /> Aberto</span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-400 text-xs font-medium"><Clock className="w-3 h-3" /> Atendendo</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary-400 transition-colors truncate max-w-[150px]" title={ticket.title}>{ticket.title}</p>
                        <p className="text-[10px] text-foreground/50 font-mono mt-0.5">#{ticket.id.split('-')[0]}</p>
                      </td>
                      <td className="p-3">
                        {ticket.assignee ? (
                          <span className="text-xs text-primary-400 font-medium truncate max-w-[80px] block">{ticket.assignee.name.split(' ')[0]}</span>
                        ) : (
                          <span className="text-[10px] text-foreground/40 italic">Aguardando</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-foreground/70 whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
