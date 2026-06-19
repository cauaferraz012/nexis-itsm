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
        <div className="mt-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const COLORS = ['#eab308', '#3b82f6', '#22c55e']; // Yellow, Blue, Green for Status

  const [activeTab, setActiveTab] = useState('ALL');

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'ALL') return true;
    return t.category === activeTab;
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
                const res = await fetch("${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets/admin/clear-all", {
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

          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
              <span className="text-lg font-bold">Todos os Chamados</span>
              <span className="text-sm font-semibold bg-white/10 px-2 py-0.5 rounded-full">{filteredTickets.length}</span>
            </div>
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
          </div>
        </>
      )}
    </div>
  );
}
