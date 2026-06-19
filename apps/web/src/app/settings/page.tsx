"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Bell, Moon, Sun, Monitor, Laptop } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("itsm_user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {}
  }, []);

  if (!user) {
    return <div className="p-8 text-foreground/50">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Configurações da Conta</h1>
        <p className="text-foreground/60">Gerencie seu perfil e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda (Perfil) */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-500/20 to-purple-500/20 blur-xl" />
            
            <div className="w-24 h-24 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center border-4 border-black/50 relative z-10 mb-4">
              <User className="w-10 h-10 text-primary-400" />
            </div>
            
            <h2 className="text-xl font-bold relative z-10">{user.name}</h2>
            <div className="flex items-center justify-center gap-2 text-sm text-foreground/60 mt-1 relative z-10">
              <Mail className="w-4 h-4" /> {user.email}
            </div>

            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium">
              <Shield className={`w-4 h-4 ${user.role === 'ADMIN' ? 'text-purple-400' : 'text-primary-400'}`} />
              {user.role === 'ADMIN' ? 'Administrador do Sistema' : 'Usuário Padrão'}
            </div>
          </div>
        </div>

        {/* Coluna da Direita (Configurações) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Sessão Perfil */}
          <section className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-xl font-semibold mb-4 border-b border-white/5 pb-4">Detalhes Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/60 mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  defaultValue={user.name} 
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground/50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/60 mb-2">Endereço de E-mail</label>
                <input 
                  type="email" 
                  defaultValue={user.email} 
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground/50 cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-xs text-foreground/40 mt-2">
              Nesta versão MVP, as alterações de perfil são gerenciadas exclusivamente pelo banco de dados ou painel administrativo.
            </p>
          </section>

          {/* Sessão Preferências */}
          <section className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-xl font-semibold mb-4 border-b border-white/5 pb-4">Preferências do Sistema</h3>
            
            <div className="space-y-6">
              
              {/* Notificações */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="p-2.5 bg-primary-500/20 text-primary-400 rounded-xl h-fit">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Notificações por E-mail</h4>
                    <p className="text-sm text-foreground/50">Receba atualizações quando seu chamado mudar de status.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-primary-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Tema Visual */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-4">
                  <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl h-fit">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Aparência</h4>
                    <p className="text-sm text-foreground/50">Escolha como o ITSM é exibido para você.</p>
                  </div>
                </div>
                
                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                  <button 
                    onClick={() => setDarkMode(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${!darkMode ? 'bg-white/10 text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
                  >
                    <Sun className="w-4 h-4" /> Claro
                  </button>
                  <button 
                    onClick={() => setDarkMode(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${darkMode ? 'bg-white/10 text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
                  >
                    <Moon className="w-4 h-4" /> Escuro
                  </button>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
