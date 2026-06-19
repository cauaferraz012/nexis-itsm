"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Clock, CheckCircle2, User as UserIcon, Activity, AlertTriangle, PauseCircle, Inbox, CheckSquare, TrendingUp, Monitor, Code, Wifi, Key, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("itsm_token");
      if (!token) return router.push("/login");

      // Adiciona um tempo mínimo de 5s para a tela de carregamento aparecer bonitinha
      await new Promise(resolve => setTimeout(resolve, 5000));

      setIsAuthChecked(true);

      try {
        const [statsRes, ticketsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets/admin/stats`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets/admin/all`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        
        if (ticketsRes.status === 401 || ticketsRes.status === 403) {
          router.push("/");
          return;
        }

        if (statsRes.ok && ticketsRes.ok) {
          setStats(await statsRes.json());
          setTickets(await ticketsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  const COLORS = ['#eab308', '#3b82f6', '#22c55e']; // Yellow, Blue, Green for Status

  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'MINE' | 'UNASSIGNED' | 'OVERDUE'>('ALL');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("itsm_user");
    if (userStr) {
      setCurrentUserId(JSON.parse(userStr).id);
    }
  }, []);

  const filteredTickets = tickets.filter(t => {
    if (activeTab !== 'ALL' && t.category !== activeTab) return false;
    
    if (quickFilter === 'MINE') return t.assigneeId === currentUserId;
    if (quickFilter === 'UNASSIGNED') return t.assigneeId === null;
    if (quickFilter === 'OVERDUE') return t.slaStatus === 'BREACHED' || (t.slaStatus === 'RUNNING' && t.slaDeadline && new Date(t.slaDeadline) < new Date());
    
    return true;
  });

  const kpiAbertos = tickets.filter(t => t.status === 'OPEN').length;
  const kpiEmAtendimento = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const kpiResolvidos = tickets.filter(t => t.status === 'RESOLVED').length;
  const kpiSlaCumprido = tickets.filter(t => t.slaStatus === 'MET').length;
  const kpiSlaEstourado = tickets.filter(t => t.slaStatus === 'BREACHED' || (t.slaStatus === 'RUNNING' && t.slaDeadline && new Date(t.slaDeadline) < new Date())).length;
  const kpiSlaPausado = tickets.filter(t => t.slaStatus === 'PAUSED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary-500/20 text-primary-400 border border-primary-500/30">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centro de Comando</h1>
            <p className="text-foreground/60">Visão global analítica dos chamados da empresa</p>
          </div>
        </div>
        <button 
          onClick={async () => {
            if (confirm("🚨 TEM CERTEZA? Isso apagará TODOS os chamados e comentários do banco de dados irreversivelmente!")) {
              try {
                const token = localStorage.getItem("itsm_token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets/admin/clear-all`, {
                  method: 'DELETE',
                  headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                  alert("Todos os chamados foram apagados!");
                  window.location.reload();
                } else {
                  alert("Erro ao apagar chamados.");
                }
              } catch (e) {
                console.error(e);
              }
            }
          }}
          className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl hover:bg-red-500/40 transition-colors font-bold text-sm"
        >
          🚨 Apagar Todos os Chamados
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-foreground/50">Carregando painel analítico...</div>
      ) : (
        <>
          {/* Grid de KPIs Detalhados */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            
            {/* KPI 1 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-foreground/70">
                <Inbox className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium uppercase tracking-wider">Abertos</span>
              </div>
              <p className="text-3xl font-bold">{kpiAbertos}</p>
            </div>

            {/* KPI 2 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-foreground/70">
                <Activity className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-medium uppercase tracking-wider">Atendendo</span>
              </div>
              <p className="text-3xl font-bold">{kpiEmAtendimento}</p>
            </div>

            {/* KPI 3 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-foreground/70">
                <CheckSquare className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium uppercase tracking-wider">Resolvidos</span>
              </div>
              <p className="text-3xl font-bold">{kpiResolvidos}</p>
            </div>

            {/* KPI 4 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-foreground/70">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium uppercase tracking-wider">SLA Cumprido</span>
              </div>
              <p className="text-3xl font-bold">{kpiSlaCumprido}</p>
            </div>

            {/* KPI 5 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-foreground/70">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium uppercase tracking-wider">SLA Estourado</span>
              </div>
              <p className="text-3xl font-bold text-red-400">{kpiSlaEstourado}</p>
            </div>

            {/* KPI 6 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-foreground/70">
                <PauseCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium uppercase tracking-wider">SLA Pausado</span>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{kpiSlaPausado}</p>
            </div>

          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Status */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <h3 className="text-foreground/60 font-medium mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Chamados por Status</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.byStatus}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats?.byStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Prioridade */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <h3 className="text-foreground/60 font-medium mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Volume por Prioridade</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.byPriority}>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabela de Chamados com Abas (Splitted by Type) */}
          <div className="flex flex-col gap-4 mb-4 mt-8">
            <h2 className="text-xl font-bold px-2">Fila Global por Categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { id: 'ALL', label: 'Todas', icon: Inbox, count: tickets.length, color: 'text-white' },
                { id: 'HARDWARE', label: 'Hardware', icon: Monitor, count: tickets.filter(t => t.category === 'HARDWARE').length, color: 'text-blue-400' },
                { id: 'SOFTWARE', label: 'Software', icon: Code, count: tickets.filter(t => t.category === 'SOFTWARE').length, color: 'text-purple-400' },
                { id: 'NETWORK', label: 'Rede', icon: Wifi, count: tickets.filter(t => t.category === 'NETWORK').length, color: 'text-green-400' },
                { id: 'ACESSOS', label: 'Acessos', icon: Key, count: tickets.filter(t => t.category === 'ACESSOS').length, color: 'text-yellow-400' },
                { id: 'OUTROS', label: 'Outros', icon: MoreHorizontal, count: tickets.filter(t => t.category === 'OUTROS').length, color: 'text-gray-400' }
              ].map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`glass-panel p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 ${activeTab === cat.id ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-2 mb-2 text-foreground/70">
                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">{cat.label}</span>
                  </div>
                  <p className="text-3xl font-bold">{cat.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col mt-4">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">Visão de Chamados</span>
                <span className="text-sm font-semibold bg-white/10 px-2 py-0.5 rounded-full">{filteredTickets.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Quick Filters */}
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                  <button onClick={() => setQuickFilter('ALL')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${quickFilter === 'ALL' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}>Todos</button>
                  <button onClick={() => setQuickFilter('MINE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${quickFilter === 'MINE' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white'}`}>Meus</button>
                  <button onClick={() => setQuickFilter('UNASSIGNED')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${quickFilter === 'UNASSIGNED' ? 'bg-yellow-500 text-white' : 'text-white/50 hover:text-white'}`}>Sem Dono</button>
                  <button onClick={() => setQuickFilter('OVERDUE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${quickFilter === 'OVERDUE' ? 'bg-red-500 text-white' : 'text-white/50 hover:text-white'}`}>Atrasados</button>
                </div>
                {/* View Toggle */}
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                  <button onClick={() => setViewMode('TABLE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'TABLE' ? 'bg-primary-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>TABELA</button>
                  <button onClick={() => setViewMode('KANBAN')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'KANBAN' ? 'bg-primary-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>KANBAN</button>
                </div>
              </div>
            </div>
            
            {viewMode === 'TABLE' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-xs text-foreground/70 uppercase tracking-wider">
                    <th className="p-3 font-medium">Status / SLA</th>
                    <th className="p-3 font-medium">Chamado</th>
                    <th className="p-3 font-medium">Resp.</th>
                    <th className="p-3 font-medium">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-foreground/50">Nenhum chamado encontrado.</td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <td className="p-3">
                          <div className="flex flex-col gap-1.5">
                            {ticket.status === 'RESOLVED' ? (
                              <span className="flex items-center gap-1 text-green-400 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Fechado</span>
                            ) : ticket.status === 'WAITING' ? (
                              <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium"><Clock className="w-3 h-3" /> Aguardando</span>
                            ) : ticket.status === 'IN_PROGRESS' ? (
                              <span className="flex items-center gap-1 text-blue-400 text-xs font-medium"><Activity className="w-3 h-3" /> Atendendo</span>
                            ) : (
                              <span className="flex items-center gap-1 text-foreground/70 text-xs font-medium"><Clock className="w-3 h-3" /> Aberto</span>
                            )}
                            
                            {/* SLA Tag */}
                            {ticket.slaStatus === 'RUNNING' && ticket.slaDeadline && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold w-max ${new Date() > new Date(ticket.slaDeadline) ? 'bg-red-500/20 text-red-400' : 'bg-primary-500/20 text-primary-400'}`}>
                                SLA {new Date() > new Date(ticket.slaDeadline) ? 'Estourado' : 'Correndo'}
                              </span>
                            )}
                            {ticket.slaStatus === 'PAUSED' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold w-max bg-yellow-500/20 text-yellow-400">SLA Pausado</span>}
                            {ticket.slaStatus === 'MET' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold w-max bg-green-500/20 text-green-400">SLA Cumprido</span>}
                            {ticket.slaStatus === 'BREACHED' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold w-max bg-red-500/20 text-red-400">SLA Estourado</span>}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm group-hover:text-primary-400 transition-colors truncate max-w-[150px]" title={ticket.title}>{ticket.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-foreground/50 font-mono">#{ticket.id.split('-')[0]}</span>
                            <UserIcon className="w-3 h-3 text-foreground/40 ml-1" />
                            <span className="text-[10px] text-foreground/60 truncate max-w-[60px]" title={ticket.author?.name}>{ticket.author?.name.split(' ')[0]}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {ticket.assignee ? (
                            <span className="text-xs text-primary-400 font-medium truncate max-w-[80px] block">{ticket.assignee.name.split(' ')[0]}</span>
                          ) : (
                            <span className="text-[10px] text-foreground/40 italic">Aguardando</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ticket.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' : ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-foreground/70'}`}>
                            {ticket.priority}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-black/20">
                {/* Coluna ABERTO */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-foreground/50"></span>
                    <h3 className="font-bold text-foreground/80 uppercase tracking-wider text-sm">Abertos</h3>
                    <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{filteredTickets.filter(t => t.status === 'OPEN').length}</span>
                  </div>
                  {filteredTickets.filter(t => t.status === 'OPEN').map(ticket => (
                    <KanbanCard key={ticket.id} ticket={ticket} onClick={() => router.push(`/tickets/${ticket.id}`)} />
                  ))}
                </div>

                {/* Coluna EM ANDAMENTO */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h3 className="font-bold text-blue-400 uppercase tracking-wider text-sm">Em Andamento</h3>
                    <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{filteredTickets.filter(t => t.status === 'IN_PROGRESS').length}</span>
                  </div>
                  {filteredTickets.filter(t => t.status === 'IN_PROGRESS').map(ticket => (
                    <KanbanCard key={ticket.id} ticket={ticket} onClick={() => router.push(`/tickets/${ticket.id}`)} />
                  ))}
                </div>

                {/* Coluna AGUARDANDO */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <h3 className="font-bold text-yellow-400 uppercase tracking-wider text-sm">Aguardando</h3>
                    <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{filteredTickets.filter(t => t.status === 'WAITING').length}</span>
                  </div>
                  {filteredTickets.filter(t => t.status === 'WAITING').map(ticket => (
                    <KanbanCard key={ticket.id} ticket={ticket} onClick={() => router.push(`/tickets/${ticket.id}`)} />
                  ))}
                </div>

                {/* Coluna RESOLVIDO */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <h3 className="font-bold text-green-400 uppercase tracking-wider text-sm">Resolvidos</h3>
                    <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{filteredTickets.filter(t => t.status === 'RESOLVED').length}</span>
                  </div>
                  {filteredTickets.filter(t => t.status === 'RESOLVED').map(ticket => (
                    <KanbanCard key={ticket.id} ticket={ticket} onClick={() => router.push(`/tickets/${ticket.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KanbanCard({ ticket, onClick }: { ticket: any, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="glass-panel p-4 rounded-xl border border-white/10 cursor-pointer hover:border-primary-500/50 hover:-translate-y-1 transition-all flex flex-col gap-3 bg-white/5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] text-foreground/50 font-mono">#{ticket.id.split('-')[0]}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ticket.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' : ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-foreground/70'}`}>
          {ticket.priority}
        </span>
      </div>
      <h4 className="font-medium text-sm leading-tight group-hover:text-primary-400 transition-colors line-clamp-2">{ticket.title}</h4>
      
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <UserIcon className="w-3 h-3 text-foreground/40" />
          <span className="text-[10px] text-foreground/60 truncate max-w-[60px]" title={ticket.author?.name}>{ticket.author?.name.split(' ')[0]}</span>
        </div>
        {ticket.assignee ? (
          <span className="text-[10px] bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded font-medium truncate max-w-[80px]" title={`Resp: ${ticket.assignee.name}`}>
            {ticket.assignee.name.split(' ')[0]}
          </span>
        ) : (
          <span className="text-[10px] text-foreground/40 italic">Não Atribuído</span>
        )}
      </div>

      {ticket.slaStatus === 'RUNNING' && ticket.slaDeadline && (
        <div className={`text-[10px] px-2 py-1 rounded font-bold w-full text-center mt-1 ${new Date() > new Date(ticket.slaDeadline) ? 'bg-red-500/20 text-red-400' : 'bg-primary-500/10 text-primary-400'}`}>
          SLA: {new Date() > new Date(ticket.slaDeadline) ? 'Estourado' : 'No Prazo'}
        </div>
      )}
      {ticket.slaStatus === 'BREACHED' && <div className="text-[10px] px-2 py-1 rounded font-bold w-full text-center mt-1 bg-red-500/20 text-red-400">SLA Estourado</div>}
    </div>
  );
}
