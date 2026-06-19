"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Clock, CheckCircle2, Send, User, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [ticket, setTicket] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTicketDetails = async () => {
    const token = localStorage.getItem("itsm_token");
    if (!token) return router.push("/login");

    try {
      const res = await fetch(`http://localhost:3001/tickets/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setTicket(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("itsm_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'ADMIN');
      setCurrentUserId(user.id);
    }
    fetchTicketDetails();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("itsm_token");

    try {
      const formData = new FormData();
      formData.append("text", newComment);
      
      const file = (window as any).commentFile;
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch(`http://localhost:3001/tickets/${id}/comments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setNewComment("");
        (window as any).commentFile = null;
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        fetchTicketDetails(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const token = localStorage.getItem("itsm_token");
    try {
      const res = await fetch(`http://localhost:3001/tickets/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchTicketDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignToMe = async () => {
    const token = localStorage.getItem("itsm_token");
    try {
      const res = await fetch(`http://localhost:3001/tickets/${id}/assign`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchTicketDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const calculateSlaHoursRemaining = () => {
    if (!ticket?.slaDeadline) return null;
    const now = new Date();
    const deadline = new Date(ticket.slaDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.round(diffMs / (1000 * 60 * 60));
    return hours;
  };

  if (isLoading) {
    return <div className="text-center p-12 text-foreground/50">Carregando detalhes do chamado...</div>;
  }

  if (!ticket) {
    return <div className="text-center p-12 text-red-400">Chamado não encontrado.</div>;
  }

  const slaRemaining = calculateSlaHoursRemaining();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-foreground/60 hover:text-primary-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{ticket.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${ticket.type === 'REQUEST' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                  {ticket.type === 'REQUEST' ? '🔵 Requerimento' : '🔴 Incidente'}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-foreground/70">
                  {ticket.category}
                </span>
              </div>
              <p className="text-sm text-foreground/50 mt-2">Chamado #{ticket.id.split("-")[0]} aberto em {format(new Date(ticket.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-md text-sm font-semibold bg-black/20 border border-white/5">
                {ticket.priority}
              </span>
              
              {isAdmin && ticket.slaStatus === 'RUNNING' && slaRemaining !== null && (
                <span className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-1 ${slaRemaining < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'}`}>
                  <Clock className="w-3.5 h-3.5" /> 
                  {slaRemaining < 0 ? `Atrasado ${Math.abs(slaRemaining)}h` : `SLA: ${slaRemaining}h`}
                </span>
              )}
              {isAdmin && ticket.slaStatus === 'PAUSED' && (
                <span className="px-3 py-1 rounded-md text-sm font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> SLA Pausado
                </span>
              )}
              {isAdmin && ticket.slaStatus === 'MET' && (
                <span className="px-3 py-1 rounded-md text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SLA Cumprido
                </span>
              )}

              {isAdmin && ticket.status !== 'RESOLVED' && (!ticket.assigneeId || ticket.assigneeId === currentUserId) ? (
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none cursor-pointer"
                >
                  <option value="OPEN">⚪ Aberto</option>
                  <option value="IN_PROGRESS">🔵 Em Progresso</option>
                  <option value="WAITING">🟡 Aguardando Usuário</option>
                  <option value="RESOLVED">🟢 Resolvido</option>
                </select>
              ) : (
                <span className="px-3 py-1 rounded-md text-sm font-semibold bg-white/5 border border-white/10">
                  {ticket.status === 'OPEN' ? '⚪ Aberto' : ticket.status === 'IN_PROGRESS' ? '🔵 Em Progresso' : ticket.status === 'WAITING' ? '🟡 Aguardando Você' : '🟢 Resolvido'}
                </span>
              )}
              
              {isAdmin && !ticket.assigneeId && ticket.status !== 'RESOLVED' && (
                <button onClick={handleAssignToMe} className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  Atribuir a mim
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            {ticket.attachmentUrl && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm text-foreground/50 mb-2">Anexo:</p>
                <a href={`http://localhost:3001${ticket.attachmentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300">
                  📎 Ver Anexo
                </a>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-foreground/60">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Aberto por <strong>{ticket.author?.name}</strong></span>
            </div>
            
            <span className="hidden sm:inline text-white/20">•</span>
            
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-400" />
              <span>Responsável: {ticket.assignee ? <strong className="text-primary-400">{ticket.assignee.name}</strong> : <span className="italic">Ninguém atribuído</span>}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comentários / Linha do Tempo */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          Histórico
        </h2>

        <div className="space-y-4">
          {ticket.comments.length === 0 ? (
            <p className="text-center text-sm text-foreground/40 py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
              Nenhuma mensagem enviada ainda.
            </p>
          ) : (
            ticket.comments.map((comment: any) => {
              const isIT = comment.author?.role === 'ADMIN';
              return (
                <div key={comment.id} className={`glass-panel p-5 rounded-2xl border ${isIT ? 'border-primary-500/30 bg-primary-500/5 ml-8' : 'border-white/10 mr-8'} flex gap-4`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIT ? 'bg-primary-500/20 text-primary-400' : 'bg-white/10 text-foreground/70'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm flex items-center gap-2">
                        {comment.author?.name}
                        {isIT && <span className="text-[10px] uppercase bg-primary-500 text-white px-1.5 py-0.5 rounded font-bold">SUPORTE TI</span>}
                      </span>
                      <span className="text-xs text-foreground/40">
                        {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.text}</p>
                    {comment.attachmentUrl && (
                      <div className="mt-3">
                        <a href={`http://localhost:3001${comment.attachmentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 px-3 py-1.5 rounded-full">
                          📎 Anexo
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Novo Comentário */}
        {ticket.status === 'RESOLVED' ? (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-foreground/70 font-medium">Este chamado foi resolvido e encerrado.</p>
            <p className="text-sm text-foreground/50 mt-1">Se precisar de mais ajuda, por favor, abra um novo chamado.</p>
          </div>
        ) : isAdmin && ticket.assigneeId && ticket.assigneeId !== currentUserId ? (
          <div className="glass-panel p-6 rounded-2xl border border-yellow-500/20 text-center bg-yellow-500/5">
            <p className="text-yellow-400 font-medium">Este chamado está sendo atendido por outro administrador.</p>
          </div>
        ) : (
          <form onSubmit={handleAddComment} className="glass-panel p-4 rounded-2xl border border-white/10">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Digite sua mensagem ou atualização..."
              className="w-full bg-transparent resize-none border-none focus:ring-0 p-2 text-sm placeholder:text-foreground/40 mb-2"
              rows={2}
            />
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <input
                type="file"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    (window as any).commentFile = target.files[0];
                  }
                }}
                className="text-xs text-foreground/50 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-white/5 file:text-foreground/70 hover:file:bg-white/10 cursor-pointer"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Send className="w-4 h-4" /> Enviar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
