import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import logoSvg from "@/Ativo 1.svg";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Scissors, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Layers, 
  Settings, 
  User, 
  Check, 
  X, 
  ChevronRight, 
  ArrowRight, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  LogOut, 
  Menu,
  Sliders,
  Hourglass,
  CalendarDays,
  FileText
} from "lucide-react";
import { 
  Appointment, 
  Professional, 
  Service, 
  ServiceCategory, 
  WaitlistEntry, 
  Coupon, 
  DashboardStats,
  Business 
} from "../types";

interface AdminPanelProps {
  onLogout: () => void;
  business: Business;
  onUpdateBusiness: (updated: Business) => void;
}

type TabType = "overview" | "agenda" | "appointments" | "clients" | "professionals" | "services" | "waitlist" | "coupons" | "settings";

export default function AdminPanel({ onLogout, business, onUpdateBusiness }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States loaded from backend
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);

  // Load status
  const [loading, setLoading] = useState(true);

  // Modal / CRUD temp states
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [newAppt, setNewAppt] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    professionalId: "",
    date: "",
    startsAt: "",
    serviceIds: [] as string[],
    customerNote: ""
  });

  const [filterProf, setFilterProf] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [apptSlots, setApptSlots] = useState<any[]>([]);

  // Reload statistics and general tables
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [
        statsRes, 
        apptsRes, 
        profsRes, 
        servsRes, 
        catsRes, 
        waitRes, 
        coupRes, 
        custsRes,
        excRes
      ] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/appointments"),
        fetch("/api/professionals"),
        fetch("/api/services"),
        fetch("/api/categories"),
        fetch("/api/waitlist"),
        fetch("/api/coupons"),
        fetch("/api/customers"),
        fetch("/api/exceptions")
      ]);

      setStats(await statsRes.json());
      setAppointments(await apptsRes.json());
      setProfessionals(await profsRes.json());
      setServices(await servsRes.json());
      setCategories(await catsRes.json());
      setWaitlist(await waitRes.json());
      setCoupons(await coupRes.json());
      setCustomers(await custsRes.json());
      setExceptions(await excRes.json());
    } catch (err) {
      console.error("Error loading admin information", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Load slots for new manual booking in admin
  useEffect(() => {
    if (!newAppt.date || !newAppt.professionalId || newAppt.serviceIds.length === 0) return;
    async function loadSlots() {
      try {
        const servicesCsv = newAppt.serviceIds.join(",");
        const res = await fetch(`/api/availability?date=${newAppt.date}&services=${servicesCsv}&professionalId=${newAppt.professionalId}`);
        const slots = await res.json();
        setApptSlots(slots);
      } catch (err) {
        console.error("Error loading slots in admin", err);
      }
    }
    loadSlots();
  }, [newAppt.date, newAppt.professionalId, newAppt.serviceIds]);

  // Status transitions helper
  const handleUpdateStatus = async (apptId: string, status: Appointment['status']) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Service CRUD helper
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const isNew = !editingService.id;
      const url = isNew ? "/api/services" : `/api/services/${editingService.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService)
      });

      if (res.ok) {
        setIsServiceModalOpen(false);
        setEditingService(null);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Professional CRUD helper
  const handleSaveProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProf) return;

    try {
      const isNew = !editingProf.id;
      const url = isNew ? "/api/professionals" : `/api/professionals/${editingProf.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProf)
      });

      if (res.ok) {
        setIsProfModalOpen(false);
        setEditingProf(null);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Coupon CRUD helper
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      const isNew = !editingCoupon.id;
      const url = isNew ? "/api/coupons" : `/api/coupons/${editingCoupon.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCoupon)
      });

      if (res.ok) {
        setIsCouponModalOpen(false);
        setEditingCoupon(null);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manual appointment creator
  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAppt,
          source: "admin"
        })
      });

      if (res.ok) {
        setIsAppointmentModalOpen(false);
        setNewAppt({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          professionalId: "",
          date: "",
          startsAt: "",
          serviceIds: [],
          customerNote: ""
        });
        loadAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar agendamento.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Status Text / Styling
  const getStatusLabelAndColor = (status: Appointment['status']) => {
    switch (status) {
      case "pending":
        return { label: "Pendente", class: "bg-warning-custom/10 text-warning-custom border-warning-custom/20" };
      case "confirmed":
        return { label: "Confirmado", class: "bg-success-custom/10 text-success-custom border-success-custom/20" };
      case "in_progress":
        return { label: "Em Atendimento", class: "bg-info-custom/10 text-info-custom border-info-custom/20" };
      case "completed":
        return { label: "Concluído", class: "bg-white/10 text-text-primary border-border-custom" };
      case "cancelled":
        return { label: "Cancelado", class: "bg-danger-custom/10 text-danger-custom border-danger-custom/20" };
      case "no_show":
        return { label: "Falta", class: "bg-danger-custom/15 text-danger-custom border-danger-custom/30" };
      default:
        return { label: status, class: "bg-white/10" };
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-dark text-text-primary font-sans" id="admin_panel_dashboard">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-1 border-r border-border-custom p-6 space-y-8 justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img src={logoSvg} alt="Jonathan Francisco Studio" className="h-6 w-auto object-contain" referrerPolicy="no-referrer" />
            <div>
              <span className="text-[9px] uppercase font-bold text-brand tracking-widest block">Painel Gestão</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "overview" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <TrendingUp size={16} /> Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("agenda")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "agenda" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <Calendar size={16} /> Agenda Operacional
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "appointments" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <CalendarDays size={16} /> Agendamentos
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "clients" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <Users size={16} /> Clientes
            </button>
            <button
              onClick={() => setActiveTab("professionals")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "professionals" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <User size={16} /> Profissionais
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "services" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <Scissors size={16} /> Serviços
            </button>
            <button
              onClick={() => setActiveTab("waitlist")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "waitlist" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <Hourglass size={16} /> Fila de Espera
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "coupons" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <Tag size={16} /> Cupons de Desconto
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings" 
                  ? "bg-brand text-text-on-brand shadow-lg shadow-brand/10" 
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <Settings size={16} /> Configurações
            </button>
          </nav>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-danger-custom hover:bg-danger-custom/10 transition-all border border-transparent hover:border-danger-custom/20"
        >
          <LogOut size={16} /> Encerrar Sessão
        </button>
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Menu drawer */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-64 max-w-xs bg-surface-1 h-full p-6 space-y-6 justify-between z-50 border-r border-border-custom"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-border-custom pb-4">
                  <div className="flex items-center gap-2">
                    <img src={logoSvg} alt="Jonathan Francisco Studio" className="h-5 w-auto object-contain" referrerPolicy="no-referrer" />
                    <span className="font-bold text-[10px] text-text-muted uppercase tracking-wider">Gestão</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-muted hover:text-text-primary">
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {(["overview", "agenda", "appointments", "clients", "professionals", "services", "waitlist", "coupons", "settings"] as TabType[]).map(tab => {
                    const icons: any = {
                      overview: <TrendingUp size={14} />,
                      agenda: <Calendar size={14} />,
                      appointments: <CalendarDays size={14} />,
                      clients: <Users size={14} />,
                      professionals: <User size={14} />,
                      services: <Scissors size={14} />,
                      waitlist: <Hourglass size={14} />,
                      coupons: <Tag size={14} />,
                      settings: <Settings size={14} />
                    };
                    const labels: any = {
                      overview: "Visão Geral",
                      agenda: "Agenda Operacional",
                      appointments: "Agendamentos",
                      clients: "Clientes",
                      professionals: "Profissionais",
                      services: "Serviços",
                      waitlist: "Fila de Espera",
                      coupons: "Cupons Desconto",
                      settings: "Configurações"
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === tab 
                            ? "bg-brand text-text-on-brand" 
                            : "text-text-secondary hover:bg-surface-2"
                        }`}
                      >
                        {icons[tab]} {labels[tab]}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-danger-custom hover:bg-danger-custom/10 transition-all"
              >
                <LogOut size={14} /> Encerrar Sessão
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Administrative Container */}
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {/* Mobile Header Toolbar */}
        <div className="flex lg:hidden justify-between items-center mb-6 bg-surface-1 p-3 rounded-xl border border-border-custom">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 bg-surface-2 border border-border-custom rounded-lg text-text-primary hover:bg-surface-3 transition-all"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoSvg} alt="Jonathan Francisco Studio" className="h-5 w-auto object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>

        {/* Tab content renderer */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && stats && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="overview-tab"
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Visão Geral</h2>
                  <p className="text-text-secondary text-xs mt-1">Métricas de performance e faturamento hoje.</p>
                </div>
                <button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="bg-brand text-text-on-brand hover:bg-brand-hover font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-brand/10"
                >
                  <Plus size={14} /> Encaixe Manual
                </button>
              </div>

              {/* KPI cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-surface-1 border border-border-custom space-y-2">
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="text-[10px] uppercase font-bold tracking-widest">Faturamento Hoje</span>
                    <DollarSign size={16} className="text-brand" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-text-primary">R$ {(stats.todayRevenueCents / 100).toFixed(2).replace(".", ",")}</h3>
                  <p className="text-[10px] text-success-custom font-semibold">↑ 12% vs ontem</p>
                </div>

                <div className="p-5 rounded-2xl bg-surface-1 border border-border-custom space-y-2">
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="text-[10px] uppercase font-bold tracking-widest">Agendados Hoje</span>
                    <Calendar size={16} className="text-brand" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-text-primary">{stats.todayAppointmentsCount}</h3>
                  <p className="text-[10px] text-text-secondary font-medium">{stats.todayCompletedCount} concluídos</p>
                </div>

                <div className="p-5 rounded-2xl bg-surface-1 border border-border-custom space-y-2">
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="text-[10px] uppercase font-bold tracking-widest">Taxa de Ocupação</span>
                    <TrendingUp size={16} className="text-brand" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-text-primary">{stats.occupancyRate}%</h3>
                  <p className="text-[10px] text-text-secondary font-medium">Capacidade média</p>
                </div>

                <div className="p-5 rounded-2xl bg-surface-1 border border-border-custom space-y-2">
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="text-[10px] uppercase font-bold tracking-widest">Fila de Espera</span>
                    <Hourglass size={16} className="text-brand" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-text-primary">{stats.waitlistCount}</h3>
                  <p className="text-[10px] text-warning-custom font-semibold">Aguardando vaga</p>
                </div>
              </div>

              {/* Detailed tables for current view */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Bookings panel */}
                <div className="p-6 bg-surface-1 border border-border-custom rounded-2xl xl:col-span-2 space-y-4">
                  <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={16} className="text-brand" /> Próximos Atendimentos Hoje
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border-custom text-text-muted">
                          <th className="py-2.5">Horário</th>
                          <th className="py-2.5">Cliente</th>
                          <th className="py-2.5">Profissional</th>
                          <th className="py-2.5">Serviço</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.slice(0, 5).map(app => {
                          const dateObj = new Date(app.startsAt);
                          const hourStr = dateObj.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
                          const status = getStatusLabelAndColor(app.status);
                          return (
                            <tr key={app.id} className="border-b border-border-custom/50 hover:bg-surface-2/40 transition-colors">
                              <td className="py-3 font-bold text-brand">{hourStr}</td>
                              <td className="py-3 font-semibold text-text-primary">{app.customerName}</td>
                              <td className="py-3 text-text-secondary">{app.professionalName}</td>
                              <td className="py-3 text-text-muted truncate max-w-[120px]">Corte + Barba</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${status.class}`}>{status.label}</span>
                              </td>
                              <td className="py-3 text-right">
                                {app.status === "confirmed" && (
                                  <div className="flex gap-1 justify-end">
                                    <button 
                                      onClick={() => handleUpdateStatus(app.id, "completed")}
                                      className="p-1 bg-success-custom/10 text-success-custom border border-success-custom/20 rounded hover:bg-success-custom/20 transition-colors"
                                      title="Concluir"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateStatus(app.id, "no_show")}
                                      className="p-1 bg-danger-custom/10 text-danger-custom border border-danger-custom/20 rounded hover:bg-danger-custom/20 transition-colors"
                                      title="Falta"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Queue sidebar panel */}
                <div className="p-6 bg-surface-1 border border-border-custom rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Hourglass size={16} className="text-brand" /> Fila de Espera Ativa
                  </h3>

                  <div className="space-y-3">
                    {waitlist.filter(w => w.status === "active").slice(0, 3).map(w => (
                      <div key={w.id} className="p-3 bg-surface-2 border border-border-custom rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-text-primary text-xs">{w.customerName}</p>
                            <p className="text-[10px] text-text-muted">{w.customerPhone}</p>
                          </div>
                          <span className="text-[9px] uppercase font-semibold text-brand bg-brand/10 px-1.5 py-0.5 border border-brand/20 rounded">
                            {w.preferredPeriods.join(", ")}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary">Preferencia: {w.preferredDateStart}</p>
                      </div>
                    ))}
                    {waitlist.filter(w => w.status === "active").length === 0 && (
                      <p className="text-text-muted text-xs text-center py-6">Nenhum cliente na fila de espera.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "agenda" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="agenda-tab"
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Agenda Operacional</h2>
                  <p className="text-text-secondary text-xs mt-1">Quadro operacional diário por profissional.</p>
                </div>
                <button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="bg-brand text-text-on-brand hover:bg-brand-hover font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-brand/10"
                >
                  <Plus size={14} /> Novo Agendamento
                </button>
              </div>

              {/* Professionals horizontal filter list */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setFilterProf("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    filterProf === "all" 
                      ? "bg-brand text-text-on-brand border-brand" 
                      : "bg-surface-1 text-text-secondary border-border-custom hover:border-brand"
                  }`}
                >
                  Todos Barbeiros
                </button>
                {professionals.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFilterProf(p.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      filterProf === p.id 
                        ? "bg-brand text-text-on-brand border-brand" 
                        : "bg-surface-1 text-text-secondary border-border-custom hover:border-brand"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {professionals
                  .filter(p => filterProf === "all" || p.id === filterProf)
                  .map(p => {
                    const profAppts = appointments.filter(app => app.professionalId === p.id && app.status !== "cancelled" && app.status !== "no_show");
                    return (
                      <div key={p.id} className="p-5 bg-surface-1 border border-border-custom rounded-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-border-custom pb-3">
                          <img src={p.avatarUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <h4 className="font-bold text-text-primary text-sm">{p.name}</h4>
                            <p className="text-[10px] text-brand uppercase font-bold tracking-wider">Disponível Hoje</p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {profAppts.length === 0 ? (
                            <p className="text-text-muted text-xs py-10 text-center">Nenhum agendamento para hoje.</p>
                          ) : (
                            profAppts.map(app => {
                              const dateObj = new Date(app.startsAt);
                              const hourStr = dateObj.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
                              const status = getStatusLabelAndColor(app.status);
                              return (
                                <div key={app.id} className="p-3 bg-surface-2 border border-border-custom rounded-xl flex justify-between items-center">
                                  <div>
                                    <span className="font-extrabold text-xs text-brand">{hourStr}</span>
                                    <h5 className="font-bold text-text-primary text-xs mt-0.5">{app.customerName}</h5>
                                    <p className="text-[10px] text-text-muted mt-0.5">{app.customerPhone}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${status.class}`}>{status.label}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {activeTab === "appointments" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="appointments-tab"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Agendamentos</h2>
                  <p className="text-text-secondary text-xs mt-1">Controle total e histórico de atendimentos.</p>
                </div>
              </div>

              {/* Status filtering toolbar */}
              <div className="flex flex-wrap gap-2">
                {["all", "confirmed", "completed", "cancelled", "no_show"].map(status => {
                  const labelMap: any = {
                    all: "Todos",
                    confirmed: "Confirmados",
                    completed: "Concluídos",
                    cancelled: "Cancelados",
                    no_show: "Não Compareceram"
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        filterStatus === status
                          ? "bg-brand text-text-on-brand border-brand"
                          : "bg-surface-1 text-text-secondary border-border-custom hover:border-brand"
                      }`}
                    >
                      {labelMap[status]}
                    </button>
                  );
                })}
              </div>

              <div className="p-6 bg-surface-1 border border-border-custom rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-custom text-text-muted uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Código</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Barbeiro</th>
                        <th className="pb-3">Data & Hora</th>
                        <th className="pb-3">Valor</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .filter(app => filterStatus === "all" || app.status === filterStatus)
                        .map(app => {
                          const dateObj = new Date(app.startsAt);
                          const localDateStr = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                          const localTimeStr = dateObj.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
                          const status = getStatusLabelAndColor(app.status);

                          return (
                            <tr key={app.id} className="border-b border-border-custom/50 hover:bg-surface-2/40 transition-colors">
                              <td className="py-3.5 font-mono text-text-secondary font-bold">{app.shortCode}</td>
                              <td className="py-3.5">
                                <p className="font-bold text-text-primary text-xs">{app.customerName}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">{app.customerPhone}</p>
                              </td>
                              <td className="py-3.5 text-text-secondary font-medium">{app.professionalName}</td>
                              <td className="py-3.5">
                                <p className="font-bold text-text-primary">{localDateStr}</p>
                                <p className="text-[10px] text-brand font-semibold">{localTimeStr}</p>
                              </td>
                              <td className="py-3.5 font-semibold text-text-primary">
                                R$ {(app.totalCents / 100).toFixed(2).replace(".", ",")}
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold ${status.class}`}>{status.label}</span>
                              </td>
                              <td className="py-3.5 text-right">
                                {app.status === "confirmed" && (
                                  <div className="flex gap-1 justify-end">
                                    <button 
                                      onClick={() => handleUpdateStatus(app.id, "completed")}
                                      className="py-1 px-2.5 bg-success-custom/10 text-success-custom border border-success-custom/20 hover:bg-success-custom/20 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      Finalizar
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateStatus(app.id, "no_show")}
                                      className="py-1 px-2.5 bg-danger-custom/10 text-danger-custom border border-danger-custom/20 hover:bg-danger-custom/20 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      No-Show
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "clients" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="clients-tab"
              className="space-y-6"
            >
              <div>
                <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Ficha de Clientes</h2>
                <p className="text-text-secondary text-xs mt-1">Histórico comercial e frequência por cliente.</p>
              </div>

              <div className="p-6 bg-surface-1 border border-border-custom rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-custom text-text-muted uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Celular</th>
                        <th className="pb-3">E-mail</th>
                        <th className="pb-3">Frequência</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(cust => (
                        <tr key={cust.id} className="border-b border-border-custom/50 hover:bg-surface-2/40 transition-colors">
                          <td className="py-4 font-bold text-text-primary">{cust.fullName}</td>
                          <td className="py-4 text-text-secondary font-semibold">{cust.phone}</td>
                          <td className="py-4 text-text-muted">{cust.email || "Não informado"}</td>
                          <td className="py-4 font-medium text-text-primary">
                            {cust.role === "admin" ? "Staff" : "Recorrente"}
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-success-custom/10 border border-success-custom/20 text-success-custom text-[9px] font-bold uppercase rounded">Ativo</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="services-tab"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Serviços Disponíveis</h2>
                  <p className="text-text-secondary text-xs mt-1">Gerencie seu catálogo, preços e duração.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingService({
                      id: "",
                      categoryId: "cat_corte",
                      name: "",
                      slug: "",
                      shortDescription: "",
                      description: "",
                      durationMinutes: 45,
                      bufferBeforeMinutes: 0,
                      bufferAfterMinutes: 5,
                      priceCents: 5000,
                      onlineBookingEnabled: true,
                      active: true,
                      displayOrder: 1
                    });
                    setIsServiceModalOpen(true);
                  }}
                  className="bg-brand text-text-on-brand hover:bg-brand-hover font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-brand/10"
                >
                  <Plus size={14} /> Novo Serviço
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.filter(s => s.active).map(service => (
                  <div key={service.id} className="p-5 bg-surface-1 border border-border-custom rounded-2xl flex flex-col justify-between hover:border-border-strong transition-all duration-200">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-text-primary text-base">{service.name}</h4>
                        <span className="text-brand font-bold">R$ {((service.promotionalPriceCents || service.priceCents) / 100).toFixed(2).replace(".", ",")}</span>
                      </div>
                      <p className="text-text-muted text-xs mt-2 leading-relaxed">{service.shortDescription}</p>
                      
                      <div className="flex gap-4 text-[10px] text-text-secondary font-semibold mt-4 border-t border-border-custom pt-3">
                        <span className="flex items-center gap-1"><Clock size={11} /> {service.durationMinutes} min</span>
                        <span className="flex items-center gap-1">Online: {service.onlineBookingEnabled ? "Sim" : "Não"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-3 border-t border-border-custom/40">
                      <button 
                        onClick={() => {
                          setEditingService(service);
                          setIsServiceModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-[11px] font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1 border border-border-custom"
                      >
                        <Edit size={11} /> Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "professionals" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="professionals-tab"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Equipe / Barbeiros</h2>
                  <p className="text-text-secondary text-xs mt-1">Gerencie os profissionais ativos do estúdio.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProf({
                      id: "",
                      name: "",
                      bio: "",
                      avatarUrl: "",
                      specialties: [],
                      services: [],
                      active: true,
                      displayOrder: 1
                    });
                    setIsProfModalOpen(true);
                  }}
                  className="bg-brand text-text-on-brand hover:bg-brand-hover font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-brand/10"
                >
                  <Plus size={14} /> Novo Barbeiro
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {professionals.filter(p => p.active).map(prof => (
                  <div key={prof.id} className="p-5 bg-surface-1 border border-border-custom rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex gap-4">
                        <img src={prof.avatarUrl} alt={prof.name} className="w-14 h-14 rounded-full object-cover border border-border-custom" />
                        <div>
                          <h4 className="font-bold text-text-primary text-base">{prof.name}</h4>
                          <p className="text-text-muted text-xs font-semibold leading-relaxed mt-1">{prof.bio}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prof.specialties.map(spec => (
                              <span key={spec} className="bg-surface-2 text-text-secondary text-[10px] px-2 py-0.5 rounded border border-border-custom">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-3 border-t border-border-custom">
                      <button 
                        onClick={() => {
                          setEditingProf(prof);
                          setIsProfModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-[11px] font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1 border border-border-custom"
                      >
                        <Edit size={11} /> Editar Perfil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "waitlist" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="waitlist-tab"
              className="space-y-6"
            >
              <div>
                <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Fila de Espera</h2>
                <p className="text-text-secondary text-xs mt-1">Clientes cadastrados aguardando abertura de horários.</p>
              </div>

              <div className="p-6 bg-surface-1 border border-border-custom rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-custom text-text-muted uppercase text-[10px]">
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Celular</th>
                        <th className="pb-3">Data Desejada</th>
                        <th className="pb-3">Período</th>
                        <th className="pb-3">Data Registro</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map(w => (
                        <tr key={w.id} className="border-b border-border-custom/50 hover:bg-surface-2/40 transition-colors">
                          <td className="py-4 font-bold text-text-primary">{w.customerName}</td>
                          <td className="py-4 text-text-secondary font-semibold">{w.customerPhone}</td>
                          <td className="py-4 text-text-primary">{w.preferredDateStart}</td>
                          <td className="py-4 capitalize font-semibold text-brand">{w.preferredPeriods.join(", ")}</td>
                          <td className="py-4 text-text-muted">{new Date(w.createdAt).toLocaleDateString("pt-BR")}</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-warning-custom/10 border border-warning-custom/20 text-warning-custom text-[9px] font-bold uppercase rounded">Ativa</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "coupons" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="coupons-tab"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Cupons de Desconto</h2>
                  <p className="text-text-secondary text-xs mt-1">Campanhas e códigos promocionais ativos.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCoupon({
                      id: "",
                      code: "",
                      discountType: "percentage",
                      discountValue: 10,
                      startsAt: new Date().toISOString(),
                      endsAt: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                      maxUses: 100,
                      currentUses: 0,
                      minTotalCents: 0,
                      active: true
                    });
                    setIsCouponModalOpen(true);
                  }}
                  className="bg-brand text-text-on-brand hover:bg-brand-hover font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-brand/10"
                >
                  <Plus size={14} /> Novo Cupom
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="p-5 bg-surface-1 border border-border-custom rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-black text-base text-brand tracking-wider uppercase px-2 py-1 bg-brand/10 border border-brand/20 rounded-md">
                          {coupon.code}
                        </span>
                        <span className="px-2 py-0.5 bg-success-custom/10 border border-success-custom/20 text-success-custom text-[9px] font-bold uppercase rounded">Ativo</span>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-text-secondary">
                        <p>Desconto: <strong className="text-text-primary">{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `R$ ${(coupon.discountValue/100).toFixed(2).replace(".", ",")}`}</strong></p>
                        <p>Usos: <strong className="text-text-primary">{coupon.currentUses} de {coupon.maxUses}</strong></p>
                        <p>Compra Mínima: <strong className="text-text-primary">R$ {(coupon.minTotalCents/100).toFixed(2).replace(".", ",")}</strong></p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-3 border-t border-border-custom">
                      <button 
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setIsCouponModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-[11px] font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1 border border-border-custom"
                      >
                        <Edit size={11} /> Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="settings-tab"
              className="space-y-6"
            >
              <div>
                <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-text-primary">Configurações Gerais</h2>
                <p className="text-text-secondary text-xs mt-1">Edite as informações da barbearia e do estabelecimento.</p>
              </div>

              <div className="p-6 bg-surface-1 border border-border-custom rounded-2xl max-w-2xl space-y-4">
                <h3 className="font-bold text-sm text-text-primary uppercase border-b border-border-custom pb-2">Informações Comerciais</h3>

                <form onSubmit={(e) => { e.preventDefault(); alert("Configurações atualizadas!"); }} className="space-y-4">
                  <div>
                    <label className="block text-text-secondary text-xs font-semibold mb-1">Nome do Estúdio</label>
                    <input 
                      type="text" 
                      value={business.name}
                      onChange={e => onUpdateBusiness({ ...business, name: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary text-xs font-semibold mb-1">WhatsApp / Telefone</label>
                      <input 
                        type="text" 
                        value={business.phone}
                        onChange={e => onUpdateBusiness({ ...business, phone: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-xs font-semibold mb-1">E-mail Comercial</label>
                      <input 
                        type="email" 
                        value={business.email}
                        onChange={e => onUpdateBusiness({ ...business, email: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-semibold mb-1">Endereço Completo</label>
                    <input 
                      type="text" 
                      value={business.address}
                      onChange={e => onUpdateBusiness({ ...business, address: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-semibold mb-1">Instagram URL</label>
                    <input 
                      type="text" 
                      value={business.instagramUrl}
                      onChange={e => onUpdateBusiness({ ...business, instagramUrl: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="px-6 py-3 bg-brand text-text-on-brand hover:bg-brand-hover rounded-xl text-xs font-extrabold transition-all shadow-md"
                  >
                    Salvar Configurações
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Manual Appointment Slide Modal */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface-1 border border-border-custom rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsAppointmentModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 bg-surface-2 border border-border-custom rounded-full"
            >
              <X size={16} />
            </button>

            <h3 className="font-display font-extrabold text-xl text-text-primary border-b border-border-custom pb-2">Agendamento Manual (Encaixe)</h3>

            <form onSubmit={handleManualBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Nome do Cliente *</label>
                  <input 
                    type="text" 
                    required
                    value={newAppt.customerName}
                    onChange={e => setNewAppt({ ...newAppt, customerName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Celular *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="(51) 99999-9999"
                    value={newAppt.customerPhone}
                    onChange={e => setNewAppt({ ...newAppt, customerPhone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Data *</label>
                  <input 
                    type="date" 
                    required
                    value={newAppt.date}
                    onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Barbeiro Responsável *</label>
                  <select 
                    required
                    value={newAppt.professionalId}
                    onChange={e => setNewAppt({ ...newAppt, professionalId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1">Serviço *</label>
                <div className="grid grid-cols-2 gap-2">
                  {services.filter(s => s.active).map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg border border-border-custom cursor-pointer text-[10px]">
                      <input 
                        type="checkbox"
                        checked={newAppt.serviceIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAppt({ ...newAppt, serviceIds: [...newAppt.serviceIds, s.id] });
                          } else {
                            setNewAppt({ ...newAppt, serviceIds: newAppt.serviceIds.filter(id => id !== s.id) });
                          }
                        }}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1.5">Escolha o Horário Disponível *</label>
                {newAppt.date && newAppt.professionalId && newAppt.serviceIds.length > 0 ? (
                  apptSlots.length === 0 ? (
                    <p className="text-danger-custom text-[11px] font-semibold">Sem horários para estes parâmetros.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1 max-h-[100px] overflow-y-auto pr-1">
                      {apptSlots.map(s => (
                        <button
                          key={s.startsAt}
                          type="button"
                          onClick={() => setNewAppt({ ...newAppt, startsAt: s.startsAt })}
                          className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                            newAppt.startsAt === s.startsAt 
                              ? "bg-brand text-text-on-brand border-brand" 
                              : "bg-surface-2 text-text-primary border-border-custom hover:border-brand"
                          }`}
                        >
                          {s.startsAt}
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-text-muted text-[11px]">Preencha Data, Barbeiro e Serviços para ver horários.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border-custom">
                <button 
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 rounded-xl text-xs font-bold text-text-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!newAppt.startsAt}
                  className="flex-1 py-2.5 bg-brand text-text-on-brand hover:bg-brand-hover disabled:bg-surface-2 disabled:text-text-muted rounded-xl text-xs font-extrabold"
                >
                  Agendar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service CRUD Modal */}
      {isServiceModalOpen && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-1 border border-border-custom rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 bg-surface-2 border border-border-custom rounded-full"
            >
              <X size={16} />
            </button>

            <h3 className="font-display font-extrabold text-xl text-text-primary border-b border-border-custom pb-2">
              {editingService.id ? "Editar Serviço" : "Criar Novo Serviço"}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1">Nome do Serviço *</label>
                <input 
                  type="text" 
                  required
                  value={editingService.name}
                  onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Duração (Minutos) *</label>
                  <input 
                    type="number" 
                    required
                    value={editingService.durationMinutes}
                    onChange={e => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Preço (Centavos) *</label>
                  <input 
                    type="number" 
                    required
                    value={editingService.priceCents}
                    onChange={e => setEditingService({ ...editingService, priceCents: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1">Descrição Curta *</label>
                <input 
                  type="text" 
                  required
                  value={editingService.shortDescription}
                  onChange={e => setEditingService({ ...editingService, shortDescription: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-border-custom">
                <button 
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 rounded-xl text-xs font-bold text-text-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-brand text-text-on-brand hover:bg-brand-hover rounded-xl text-xs font-extrabold"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional CRUD Modal */}
      {isProfModalOpen && editingProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-1 border border-border-custom rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsProfModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 bg-surface-2 border border-border-custom rounded-full"
            >
              <X size={16} />
            </button>

            <h3 className="font-display font-extrabold text-xl text-text-primary border-b border-border-custom pb-2">
              {editingProf.id ? "Editar Barbeiro" : "Registrar Novo Barbeiro"}
            </h3>

            <form onSubmit={handleSaveProf} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={editingProf.name}
                  onChange={e => setEditingProf({ ...editingProf, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1">URL da Foto de Perfil</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={editingProf.avatarUrl}
                  onChange={e => setEditingProf({ ...editingProf, avatarUrl: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1">Biografia Curta *</label>
                <textarea 
                  required
                  rows={2}
                  value={editingProf.bio}
                  onChange={e => setEditingProf({ ...editingProf, bio: e.target.value })}
                  className="w-full p-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-border-custom">
                <button 
                  type="button"
                  onClick={() => setIsProfModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 rounded-xl text-xs font-bold text-text-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-brand text-text-on-brand hover:bg-brand-hover rounded-xl text-xs font-extrabold"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon CRUD Modal */}
      {isCouponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-1 border border-border-custom rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsCouponModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 bg-surface-2 border border-border-custom rounded-full"
            >
              <X size={16} />
            </button>

            <h3 className="font-display font-extrabold text-xl text-text-primary border-b border-border-custom pb-2">
              {editingCoupon.id ? "Editar Cupom" : "Criar Novo Cupom"}
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-[11px] font-semibold mb-1">Código Promocional (UPPERCASE) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: NOVOESTUDIO"
                  value={editingCoupon.code}
                  onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Tipo de Desconto *</label>
                  <select 
                    value={editingCoupon.discountType}
                    onChange={e => setEditingCoupon({ ...editingCoupon, discountType: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Fixo em Centavos (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary text-[11px] font-semibold mb-1">Valor do Desconto *</label>
                  <input 
                    type="number" 
                    required
                    value={editingCoupon.discountValue}
                    onChange={e => setEditingCoupon({ ...editingCoupon, discountValue: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border-custom">
                <button 
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 rounded-xl text-xs font-bold text-text-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-brand text-text-on-brand hover:bg-brand-hover rounded-xl text-xs font-extrabold"
                >
                  Salvar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
