"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTicketModal({ isOpen, onClose, onSuccess }: NewTicketModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [type, setType] = useState("INCIDENT");
  const [category, setCategory] = useState("Sistemas/Software");
  const [file, setFile] = useState<File | null>(null);
  const [authorId, setAuthorId] = useState("");
  
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const INCIDENT_CATEGORIES = [
    "Sistemas/Software",
    "Hardware/Equipamento",
    "Rede/Internet",
    "Acesso/Login",
    "Outros"
  ];

  const REQUEST_CATEGORIES = [
    "Acessos e Permissões",
    "Novos Equipamentos",
    "Instalação de Software",
    "Dúvida/Ajuda",
    "Outros"
  ];

  // Update category when type changes
  useEffect(() => {
    if (type === "INCIDENT") {
      setCategory(INCIDENT_CATEGORIES[0]);
    } else {
      setCategory(REQUEST_CATEGORIES[0]);
    }
  }, [type]);

  useEffect(() => {
    if (isOpen) {
      const userStr = localStorage.getItem("itsm_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          setIsAdmin(true);
          fetchUsers();
        }
      }
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("itsm_token");
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("itsm_token");
      
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("priority", priority);
      formData.append("type", type);
      formData.append("category", category);
      if (isAdmin && authorId) {
        formData.append("authorId", authorId);
      }
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Erro ao criar chamado.");
      
      const data = await res.json();

      onSuccess();
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setType("INCIDENT");
      setCategory(INCIDENT_CATEGORIES[0]);
      setFile(null);
      setAuthorId("");
      
      // Se for Admin, não redireciona para a tela do chamado para não perder o dashboard (ou redireciona, opcional)
      router.push(`/tickets/${data.id}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl border border-white/10 bg-[#09090b]/90 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-foreground/50 hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-6">Novo Chamado</h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  O que você precisa?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setType("INCIDENT")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${type === 'INCIDENT' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10'}`}
                  >
                    🔴 Reportar um Problema
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("REQUEST")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${type === 'REQUEST' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10'}`}
                  >
                    🔵 Fazer uma Solicitação
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">
                    Tópico / Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1a1a20] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow appearance-none"
                  >
                    {(type === 'INCIDENT' ? INCIDENT_CATEGORIES : REQUEST_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">
                    Título Breve
                  </label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                    placeholder={type === 'INCIDENT' ? "Ex: Monitor secundário piscando" : "Ex: Solicitação de Mouse Novo"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">
                  Descrição Detalhada
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow resize-none"
                  placeholder="Descreva o que está acontecendo..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">
                  Anexo (Opcional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500/20 file:text-primary-400 hover:file:bg-primary-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#1a1a20] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow appearance-none"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              {isAdmin && users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">
                    Abrir em nome de (Opcional)
                  </label>
                  <select
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-full bg-[#1a1a20] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow appearance-none"
                  >
                    <option value="">Selecione um usuário...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Abrir Chamado
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
