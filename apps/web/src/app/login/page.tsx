/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MonitorSmartphone, UserCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // State: null means we are in the Portal Selection screen
  const [selectedPortal, setSelectedPortal] = useState<'ADMIN' | 'USER' | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Reduzimos o tempo de splash para 1.5s para um acesso mais rápido
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Ocorreu um erro. Tente novamente.");
      }

      // Salva o token JWT e as informações do usuário
      localStorage.setItem("itsm_token", data.access_token);
      localStorage.setItem("itsm_user", JSON.stringify(data.user));

      // Bloqueia usuário comum tentando entrar pelo Portal de TI
      if (selectedPortal === 'ADMIN' && data.user.role !== 'ADMIN') {
        localStorage.removeItem("itsm_token");
        localStorage.removeItem("itsm_user");
        throw new Error("Acesso Negado: Esta conta não possui privilégios de Administrador da TI.");
      }

      // Bloqueia Admin tentando entrar pelo Portal do Colaborador
      if (selectedPortal === 'USER' && data.user.role === 'ADMIN') {
        localStorage.removeItem("itsm_token");
        localStorage.removeItem("itsm_user");
        throw new Error("Conta de Administrador detectada. Por favor, volte e utilize o Portal de TI para fazer login.");
      }

      // Redireciona para o Dashboard correto, independente de onde logou
      if (data.user.role === 'ADMIN') {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background overflow-hidden">
      {/* Background Orbs que mudam de cor conforme o portal */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${
        selectedPortal === 'ADMIN' ? 'bg-purple-500/20' : 'bg-primary-500/20'
      }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${
        selectedPortal === 'ADMIN' ? 'bg-indigo-500/20' : 'bg-blue-400/20'
      }`} />

      <AnimatePresence mode="wait">
        {!selectedPortal ? (
          <motion.div
            key="portal-selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl z-10"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Bem-vindo ao NEXIS
              </h1>
              <p className="text-foreground/60 text-lg md:text-xl">
                Selecione o seu portal de acesso para continuar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Portal de TI (ADMIN) */}
              <button
                onClick={() => {
                  setSelectedPortal('ADMIN');
                  setIsLogin(true); // IT Portal sempre cai no Login (sem criar conta)
                  setError("");
                }}
                className="group relative glass-panel rounded-3xl p-8 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:-translate-y-2 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                    <MonitorSmartphone className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Portal de TI</h2>
                  <p className="text-foreground/60">
                    Acesso exclusivo para administradores, gestão de chamados, SLAs e painéis analíticos.
                  </p>
                </div>
              </button>

              {/* Portal do Colaborador (USER) */}
              <button
                onClick={() => {
                  setSelectedPortal('USER');
                  setIsLogin(true);
                  setError("");
                }}
                className="group relative glass-panel rounded-3xl p-8 border border-primary-500/20 hover:border-primary-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mb-6 text-primary-400 group-hover:scale-110 transition-transform">
                    <UserCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Portal do Colaborador</h2>
                  <p className="text-foreground/60">
                    Acesso para abrir novos chamados, solicitar serviços e acompanhar suas requisições.
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md glass-panel rounded-3xl p-8 relative z-10 border border-white/10"
          >
            <button
              onClick={() => setSelectedPortal(null)}
              className="absolute top-8 left-8 text-foreground/50 hover:text-foreground transition-colors"
              title="Voltar aos portais"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center mb-8 mt-2">
              <div className="flex justify-center mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  selectedPortal === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary-500/20 text-primary-400'
                }`}>
                  {selectedPortal === 'ADMIN' ? <MonitorSmartphone className="w-6 h-6" /> : <UserCircle className="w-6 h-6" />}
                </div>
              </div>
              <h2 className="text-2xl font-bold">
                {selectedPortal === 'ADMIN' ? 'Portal de TI' : 'Portal do Colaborador'}
              </h2>
              <p className="text-foreground/60 mt-1">
                {isLogin ? "Acesse sua conta para continuar" : "Crie sua conta para começar"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                    placeholder="Ex: João Silva"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 mt-2 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  selectedPortal === 'ADMIN' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-primary-600 hover:bg-primary-500'
                }`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? "Entrar" : "Criar Conta"}
              </button>
            </form>

            {/* Apenas o Portal de Usuário permite criar conta livremente */}
            {selectedPortal === 'USER' && (
              <div className="mt-6 text-center text-sm text-foreground/60">
                {isLogin ? "Ainda não tem uma conta? " : "Já possui uma conta? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  {isLogin ? "Criar agora" : "Fazer login"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
