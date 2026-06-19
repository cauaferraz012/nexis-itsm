/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Ticket, BookOpen, Settings, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Meus Chamados", href: "/tickets", icon: Ticket },
  { name: "Base de Conhecimento", href: "/kb", icon: BookOpen },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navItems, setNavItems] = useState(baseNavItems);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("itsm_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          setNavItems((prev) => {
            if (!prev.find(item => item.name === "Painel de TI")) {
              return [
                ...prev.slice(0, 2),
                { name: "Painel de TI", href: "/admin", icon: Shield },
                ...prev.slice(2)
              ];
            }
            return prev;
          });
        } else {
          setNavItems((prev) => prev.filter(item => item.name !== "Painel de TI"));
        }
      } else {
        setNavItems(baseNavItems);
      }
    } catch (e) {}
  }, [pathname]);

  // Fechar sidebar ao mudar de rota no mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("itsm_token");
    localStorage.removeItem("itsm_user");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/10 glass-panel z-40 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
          NEXIS
        </h1>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground/70 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 h-screen fixed left-0 top-0 border-r border-white/10 glass-panel flex flex-col z-50 transition-transform duration-300 ease-in-out bg-background md:bg-transparent",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            NEXIS
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-foreground/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                  isActive
                    ? "bg-primary-500/10 text-primary-500"
                    : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary-500" : "text-foreground/50 group-hover:text-foreground/80"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-foreground/70 hover:bg-white/5 hover:text-red-400 transition-colors group">
            <LogOut className="w-5 h-5 text-foreground/50 group-hover:text-red-400 transition-colors" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
