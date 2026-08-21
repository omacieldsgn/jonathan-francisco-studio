import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { 
  Scissors, 
  Calendar, 
  MapPin, 
  Clock, 
  Phone, 
  Instagram, 
  Lock, 
  User, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Plus, 
  AlertCircle, 
  Menu, 
  X,
  Hourglass,
  HelpCircle,
  TrendingUp,
  Award
} from "lucide-react";
import ClientFlow from "./components/ClientFlow";
import MyReservations from "./components/MyReservations";
import logoSvg from "@/Ativo 1.svg";
import homeJpg from "./home.JPG";
import AdminPanel from "./components/AdminPanel";
import WaitlistForm from "./components/WaitlistForm";
import { Business, Appointment } from "./types";
import { DEFAULT_BUSINESS } from "./fallbackData";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [view, setView] = useState<"home" | "book" | "reservations" | "admin" | "admin_login">("home");
  const [business, setBusiness] = useState<Business | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Waitlist form state
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistData, setWaitlistData] = useState<{ date?: string; serviceIds?: string[]; profId?: string }>({});

  const homeContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (view !== "home") return;

    // Subtle, buttery fade-in-up animation for highlighting cards
    const cards = gsap.utils.toArray(".highlight-card");
    cards.forEach((card: any) => {
      gsap.fromTo(card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    // Elegant animation for the contact / locations grid
    gsap.fromTo(".contact-section",
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".contact-section",
          start: "top 88%",
          toggleActions: "play none none none"
        }
      }
    );
  }, { scope: homeContainerRef, dependencies: [view] });

  // Active user / admin auth state
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Load business info on startup
  useEffect(() => {
    async function loadBusiness() {
      try {
        const res = await fetch("/api/business");
        if (!res.ok) throw new Error("API not responsive");
        const data = await res.json();
        // A new Supabase project starts empty until the seed is applied.
        // Keep the app usable while the business record is not present yet.
        setBusiness(data ?? DEFAULT_BUSINESS);
      } catch (err) {
        console.error("Error loading business configurations, applying high-fidelity client fallback:", err);
        setBusiness(DEFAULT_BUSINESS);
      }
    }
    loadBusiness();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (!res.ok) {
        const err = await res.json();
        setLoginError(err.error || "Acesso negado.");
        return;
      }

      const data = await res.json();
      setAdminUser(data.user);
      setView("admin");
      triggerToast(`Seja bem-vindo de volta, ${data.user.fullName}!`);
    } catch (err) {
      setLoginError("Erro na autenticação.");
    } finally {
      setLoggingIn(false);
    }
  };

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark text-text-secondary">
        <div className="w-12 h-12 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-sans tracking-widest text-text-muted">JONATHAN FRANCISCO STUDIO</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col justify-between selection:bg-brand selection:text-text-on-brand relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-surface-2 border border-brand/40 text-brand text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <Check size={14} className="text-brand" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header (Only if not in full Admin panel tab) */}
      {view !== "admin" && (
        <header className="sticky top-0 z-30 bg-bg-dark/80 backdrop-blur-md border-b border-border-custom px-4 md:px-8 py-4 flex justify-between items-center max-w-5xl w-full mx-auto">
          <div className="flex items-center gap-3 cursor-pointer h-9" onClick={() => setView("home")}>
            <img src={logoSvg} alt="Jonathan Francisco Studio" className="h-7 w-auto object-contain" referrerPolicy="no-referrer" />
            <span className="hidden md:inline-block text-[9px] uppercase font-bold text-text-muted tracking-widest bg-surface-1 border border-border-custom px-2 py-0.5 rounded-md">
              CONCEITO NOIR SIGNAL
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-1 text-xs font-bold">
            <button 
              onClick={() => setView("home")} 
              className={`px-4 py-2 rounded-lg transition-colors ${view === "home" ? "text-brand bg-surface-1" : "text-text-secondary hover:text-text-primary"}`}
            >
              Início
            </button>
            <button 
              onClick={() => setView("book")} 
              className={`px-4 py-2 rounded-lg transition-colors ${view === "book" ? "text-brand bg-surface-1" : "text-text-secondary hover:text-text-primary"}`}
            >
              Novo Agendamento
            </button>
            <button 
              onClick={() => setView("reservations")} 
              className={`px-4 py-2 rounded-lg transition-colors ${view === "reservations" ? "text-brand bg-surface-1" : "text-text-secondary hover:text-text-primary"}`}
            >
              Minhas Reservas
            </button>
            <button 
              onClick={() => setView("admin_login")} 
              className="px-3.5 py-1.5 border border-border-custom hover:border-brand rounded-lg text-[10px] text-text-secondary hover:text-text-primary flex items-center gap-1 transition-all uppercase"
            >
              <Lock size={10} /> Painel Gestão
            </button>
          </nav>

          <button 
            onClick={() => setView(view === "book" ? "home" : "book")}
            className="sm:hidden px-3 py-1.5 bg-brand text-text-on-brand font-bold text-[11px] rounded-lg tracking-wide hover:bg-brand-hover active:scale-95 transition-all"
          >
            {view === "book" ? "Início" : "Agendar"}
          </button>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1 max-w-5xl w-full mx-auto py-4">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div 
              ref={homeContainerRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12 px-4"
              key="home-view"
            >
              {/* Hero Banner Editorial */}
              <div 
                style={{ backgroundImage: `url(${homeJpg})` }}
                className="relative rounded-3xl overflow-hidden h-[360px] md:h-[440px] flex items-end p-6 md:p-12 shadow-2xl border border-border-custom bg-cover bg-center"
              >
                {/* Visual gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                
                <div className="relative z-10 space-y-4 max-w-xl">
                  <span className="bg-brand text-text-on-brand text-[10px] tracking-widest uppercase font-extrabold px-3 py-1 rounded-full border border-brand/30">
                    Estilo & Tradição
                  </span>
                  <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-text-primary leading-none">
                    Onde o clássico encontra a precisão.
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed max-w-md">
                    Corte de cabelo e barba com técnicas clássicas, toalha quente e finalização com produtos exclusivos Noir Signal.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => setView("book")}
                      className="bg-brand text-text-on-brand hover:bg-brand-hover active:scale-98 font-bold px-6 py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-brand/10 flex items-center justify-center gap-1.5"
                    >
                      <Calendar size={14} /> Agendar Agora
                    </button>
                    <button 
                      onClick={() => setView("reservations")}
                      className="bg-surface-1 hover:bg-surface-2 text-text-primary border border-border-custom font-semibold px-6 py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
                    >
                      Minhas Reservas
                    </button>
                  </div>
                </div>
              </div>

              {/* Highlighting Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="highlight-card p-6 bg-surface-1 border border-border-custom rounded-2xl space-y-3">
                  <div className="w-10 h-10 bg-brand/10 border border-brand/20 text-brand rounded-xl flex items-center justify-center">
                    <Scissors size={20} />
                  </div>
                  <h3 className="font-bold text-text-primary text-base">Corte Visagista Sênior</h3>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    Nossos profissionais analisam seu rosto e formato cranial para criar o visual que melhor expressa sua força.
                  </p>
                </div>

                <div className="highlight-card p-6 bg-surface-1 border border-border-custom rounded-2xl space-y-3">
                  <div className="w-10 h-10 bg-brand/10 border border-brand/20 text-brand rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <h3 className="font-bold text-text-primary text-base">Agendamento em 60s</h3>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    Processo online automatizado de alta performance. Escolha serviço, profissional e horário sem burocracia.
                  </p>
                </div>

                <div className="highlight-card p-6 bg-surface-1 border border-border-custom rounded-2xl space-y-3">
                  <div className="w-10 h-10 bg-brand/10 border border-brand/20 text-brand rounded-xl flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-bold text-text-primary text-base">Conforto Noir Signal</h3>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    Ambiente intimista climatizado, café espresso gourmet, cerveja artesanal cortesia e playlist de curadoria clássica.
                  </p>
                </div>
              </div>

              {/* Contact, route map and operational hour detail */}
              <div className="contact-section grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-1 border border-border-custom rounded-3xl p-6 md:p-8">
                <div className="space-y-6">
                  <div>
                    <span className="text-brand text-[10px] tracking-widest uppercase font-extrabold">Onde Estamos</span>
                    <h3 className="font-display font-extrabold text-2xl text-text-primary mt-1.5">Venha nos visitar</h3>
                    <p className="text-text-secondary text-xs mt-2 leading-relaxed">{business.address}</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-brand shrink-0" />
                      <div>
                        <p className="font-bold text-text-primary">Segunda a Sexta:</p>
                        <p className="text-text-secondary">09:00 às 19:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-brand shrink-0" />
                      <div>
                        <p className="font-bold text-text-primary">Sábado:</p>
                        <p className="text-text-secondary">09:00 às 18:00</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <a 
                      href={`https://wa.me/55${business.whatsapp.replace(/\D/g, "")}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-surface-2 hover:border-brand border border-border-custom rounded-xl text-xs font-bold text-text-primary transition-all flex items-center gap-1.5"
                    >
                      <Phone size={13} /> WhatsApp
                    </a>
                    <a 
                      href={business.instagramUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-surface-2 hover:border-brand border border-border-custom rounded-xl text-xs font-bold text-text-primary transition-all flex items-center gap-1.5"
                    >
                      <Instagram size={13} /> Instagram
                    </a>
                  </div>
                </div>

                {/* Simulated Google Map Container */}
                <div className="relative rounded-2xl overflow-hidden h-56 md:h-auto border border-border-strong bg-surface-2 flex items-center justify-center group">
                  <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-51.1352,-29.6841,15,0/400x300?access_token=mock')] bg-cover opacity-50 group-hover:scale-105 transition-transform duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 to-transparent"></div>
                  <div className="relative z-10 text-center space-y-2 p-4">
                    <MapPin size={24} className="text-brand mx-auto transition-transform duration-300 group-hover:-translate-y-1" />
                    <p className="font-bold text-text-primary text-xs">Novo Hamburgo, Centro</p>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-block px-3.5 py-1.5 bg-brand text-text-on-brand font-black text-[10px] tracking-wider uppercase rounded-lg shadow-md transition-all active:scale-95"
                    >
                      Abrir Rota de Navegação
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "book" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="book-view"
            >
              <ClientFlow 
                business={business} 
                onBookingSuccess={(appt) => {
                  triggerToast(`Agendamento ${appt.shortCode} realizado!`);
                }}
                onGoToReservations={() => setView("reservations")}
                onOpenWaitlist={(date, sIds, pId) => {
                  setWaitlistData({ date, serviceIds: sIds, profId: pId });
                  setIsWaitlistOpen(true);
                }}
              />
            </motion.div>
          )}

          {view === "reservations" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="reservations-view"
            >
              <MyReservations />
            </motion.div>
          )}

          {view === "admin_login" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="admin-login-view"
              className="px-4 py-12"
            >
              <div className="max-w-md mx-auto p-6 md:p-8 bg-surface-1 border border-border-custom rounded-2xl space-y-6 shadow-2xl">
                <div className="text-center space-y-2">
                  <img src={logoSvg} alt="Logo" className="h-10 w-auto mx-auto mb-2 object-contain" referrerPolicy="no-referrer" />
                  <h3 className="font-display font-extrabold text-2xl text-text-primary">Painel do Administrador</h3>
                  <p className="text-text-secondary text-xs">Utilize suas credenciais administrativas para gerenciar a agenda.</p>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-text-secondary font-semibold mb-1">E-mail *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="contato@macieldsgn.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary font-semibold mb-1">Senha *</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Digite admin123"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none transition-all"
                    />
                  </div>

                  {loginError && (
                    <p className="text-danger-custom font-semibold flex items-center gap-1.5">
                      <AlertCircle size={14} /> {loginError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full py-3.5 bg-brand text-text-on-brand hover:bg-brand-hover font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
                  >
                    {loggingIn ? "Acessando..." : "Entrar no Painel"}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-text-muted text-[10px] leading-relaxed">
                    Credencial padrão de demonstração:<br />
                    E-mail: <strong className="text-brand">contato@macieldsgn.com</strong> | Senha: <strong className="text-brand font-mono">admin123</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === "admin" && adminUser && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="admin-view"
            >
              <AdminPanel 
                business={business} 
                onUpdateBusiness={(updated) => setBusiness(updated)}
                onLogout={() => {
                  setAdminUser(null);
                  setView("home");
                  triggerToast("Sessão administrativa encerrada.");
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Waiting List bottom-sheet dialog */}
      {isWaitlistOpen && (
        <WaitlistForm 
          initialDate={waitlistData.date}
          initialServices={waitlistData.serviceIds}
          initialProfId={waitlistData.profId}
          onClose={() => setIsWaitlistOpen(false)}
          onSuccess={() => triggerToast("Você foi adicionado à Fila de Espera!")}
        />
      )}

      {/* Footer (Only if not in full Admin panel tab) */}
      {view !== "admin" && (
        <footer className="border-t border-border-custom py-6 px-4 text-center text-text-muted text-[11px] max-w-5xl w-full mx-auto space-y-2">
          <p>© {new Date().getFullYear()} {business.name}. Todos os direitos reservados.</p>
          <p className="opacity-80">Conceito estético e de desenvolvimento sob diretrizes exclusivas do Design System Noir Signal.</p>
        </footer>
      )}

      {/* Mobile Bottom Fixed Navigation Strip (Only on mobile viewport and if not in admin workspace) */}
      {view !== "admin" && (
        <div className="sm:hidden sticky bottom-0 left-0 right-0 bg-surface-3/95 backdrop-blur-md border-t border-border-strong px-6 py-3 flex justify-between items-center z-20">
          <button 
            onClick={() => setView("home")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${view === "home" ? "text-brand font-extrabold" : "text-text-muted hover:text-text-primary"}`}
          >
            <Scissors size={18} />
            <span>Início</span>
          </button>
          <button 
            onClick={() => setView("book")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${view === "book" ? "text-brand font-extrabold" : "text-text-muted hover:text-text-primary"}`}
          >
            <Calendar size={18} />
            <span>Agendar</span>
          </button>
          <button 
            onClick={() => setView("reservations")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${view === "reservations" ? "text-brand font-extrabold" : "text-text-muted hover:text-text-primary"}`}
          >
            <Clock size={18} />
            <span>Reservas</span>
          </button>
          <button 
            onClick={() => setView("admin_login")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${view === "admin_login" ? "text-brand font-extrabold" : "text-text-muted hover:text-text-primary"}`}
          >
            <Lock size={18} />
            <span>Gestão</span>
          </button>
        </div>
      )}
    </div>
  );
}
