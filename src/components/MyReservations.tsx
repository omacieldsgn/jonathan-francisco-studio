import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Calendar, 
  Clock, 
  Scissors, 
  User, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  Check, 
  X,
  Phone,
  HelpCircle
} from "lucide-react";
import { Appointment, Service, Professional } from "../types";

export default function MyReservations() {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  // Modals / Actions
  const [cancellingApp, setCancellingApp] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  
  const [reschedulingApp, setReschedulingApp] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  // Phone input formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.substring(0, 11);
    
    if (val.length > 6) {
      val = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
    } else if (val.length > 2) {
      val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setPhone(val);
  };

  const fetchBookings = async () => {
    if (phone.length < 14) {
      setError("Por favor, digite o número completo com DDD.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const res = await fetch(`/api/appointments?phone=${cleanPhone}`);
      const data = await res.json();
      setAppointments(data);
      setSearched(true);
    } catch (err) {
      setError("Erro ao carregar reservas.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch slot availability for rescheduling
  useEffect(() => {
    if (!reschedulingApp || !rescheduleDate) return;

    async function loadSlots() {
      setLoadingSlots(true);
      try {
        // We need service IDs of this booking. Let's fetch the detailed appointment or mock,
        // but wait! Our backend GET `/api/appointments/:id` returns items inside the booking.
        const appRes = await fetch(`/api/appointments/${reschedulingApp.id}`);
        const detailedApp = await appRes.json();
        
        const serviceIds = detailedApp.items?.map((i: any) => i.serviceId).join(",") || "serv_corte";
        const res = await fetch(`/api/availability?date=${rescheduleDate}&services=${serviceIds}&professionalId=${reschedulingApp.professionalId}`);
        const slots = await res.json();
        setAvailableSlots(slots);
      } catch (err) {
        console.error("Error loading reschedule slots", err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [reschedulingApp, rescheduleDate]);

  // Cancel Booking Trigger
  const handleCancel = async () => {
    if (!cancellingApp) return;
    try {
      const res = await fetch(`/api/appointments/${cancellingApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          cancellationReason,
          cancelledAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        // Refresh bookings
        fetchBookings();
        setCancellingApp(null);
        setCancellationReason("");
      } else {
        alert("Erro ao cancelar agendamento.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reschedule Booking Trigger
  const handleReschedule = async () => {
    if (!reschedulingApp || !rescheduleDate || !rescheduleTime) return;
    try {
      const res = await fetch(`/api/appointments/${reschedulingApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rescheduleDate,
          startsAt: rescheduleTime,
          status: "confirmed" // reset to confirmed if it was pending
        })
      });

      if (res.ok) {
        fetchBookings();
        setReschedulingApp(null);
        setRescheduleDate("");
        setRescheduleTime("");
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao reagendar.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case "pending":
        return <span className="bg-warning-custom/10 text-warning-custom text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-warning-custom/20">Pendente</span>;
      case "confirmed":
        return <span className="bg-success-custom/10 text-success-custom text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-success-custom/20">Confirmado</span>;
      case "in_progress":
        return <span className="bg-info-custom/10 text-info-custom text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-info-custom/20">Em Atendimento</span>;
      case "completed":
        return <span className="bg-white/10 text-text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-border-custom">Concluído</span>;
      case "cancelled":
        return <span className="bg-danger-custom/10 text-danger-custom text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-danger-custom/20">Cancelado</span>;
      case "no_show":
        return <span className="bg-danger-custom/10 text-danger-custom text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-danger-custom/30">Não Compareceu</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0 py-6" id="my_reservations_container">
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-display font-extrabold text-3xl text-text-primary tracking-tight">Minhas Reservas</h2>
        <p className="text-text-secondary text-sm">Consulte, reagende ou cancele seus atendimentos no estúdio.</p>
      </div>

      {/* Phone input Form */}
      <div className="p-6 bg-surface-1 border border-border-custom rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-3.5 text-text-muted">
              <Phone size={18} />
            </span>
            <input 
              type="text" 
              placeholder="(51) 99999-9999"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-sm focus:border-brand focus:outline-none transition-all font-semibold"
            />
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="h-12 px-6 bg-brand text-text-on-brand hover:bg-brand-hover disabled:bg-surface-2 disabled:text-text-muted rounded-xl text-xs font-extrabold transition-all shadow-md shadow-brand/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-text-on-brand border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search size={14} />
            )}
            Consultar Reservas
          </button>
        </div>

        {error && <p className="text-danger-custom text-xs font-semibold flex items-center gap-1"><AlertCircle size={13} /> {error}</p>}
      </div>

      {/* Booking List Output */}
      {searched && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xs font-bold text-text-muted tracking-widest uppercase mb-4">Seus Agendamentos ({appointments.length})</h3>

          {appointments.length === 0 ? (
            <div className="p-12 text-center bg-surface-1 border border-border-custom rounded-2xl space-y-2">
              <AlertCircle size={32} className="text-text-muted mx-auto" />
              <p className="text-text-primary font-bold">Nenhum agendamento encontrado</p>
              <p className="text-text-secondary text-xs">Não encontramos reservas associadas ao telefone {phone}.</p>
            </div>
          ) : (
            appointments.map(app => {
              const appDate = new Date(app.startsAt);
              const formattedDate = appDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
              const formattedTime = appDate.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
              const isPast = appDate.getTime() < Date.now();
              const isActionable = app.status === "confirmed" || app.status === "pending";

              return (
                <div key={app.id} className="p-5 bg-surface-1 border border-border-custom rounded-2xl hover:border-border-strong transition-all duration-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Reserva: <span className="font-mono text-text-secondary">{app.shortCode}</span></p>
                      <h4 className="text-text-primary font-bold text-base capitalize">{formattedDate}</h4>
                      <p className="text-brand font-extrabold text-sm">{formattedTime}</p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="border-t border-dashed border-border-custom pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <User size={14} className="text-brand shrink-0" />
                      <span>Profissional: <strong className="text-text-primary">{app.professionalName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Clock size={14} className="text-brand shrink-0" />
                      <span>Valor total: <strong className="text-text-primary">R$ {(app.totalCents / 100).toFixed(2).replace(".", ",")}</strong></span>
                    </div>
                  </div>

                  {/* Actions (Only if active and not in the past) */}
                  {isActionable && !isPast && (
                    <div className="border-t border-border-custom pt-3 flex gap-2 justify-end">
                      <button 
                        onClick={() => {
                          setReschedulingApp(app);
                          setRescheduleDate(new Date(app.startsAt).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }));
                        }}
                        className="flex items-center gap-1 py-2 px-3 bg-surface-2 border border-border-custom hover:border-brand rounded-xl text-xs font-bold text-text-primary transition-colors"
                      >
                        <RefreshCw size={12} /> Reagendar
                      </button>
                      <button 
                        onClick={() => setCancellingApp(app)}
                        className="flex items-center gap-1 py-2 px-3 bg-danger-custom/10 hover:bg-danger-custom/20 border border-danger-custom/30 rounded-xl text-xs font-bold text-danger-custom transition-colors"
                      >
                        <Trash2 size={12} /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-1 border border-border-custom rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setCancellingApp(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 bg-surface-2 border border-border-custom rounded-full"
            >
              <X size={16} />
            </button>

            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-xl text-text-primary">Cancelar Agendamento?</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Você está prestes a cancelar a reserva <strong className="text-brand font-mono">{cancellingApp.shortCode}</strong>. Esta ação não pode ser desfeita.
              </p>
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-semibold mb-1.5">Motivo do cancelamento (opcional)</label>
              <input 
                type="text"
                placeholder="Ex: Mudança de planos"
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none transition-all"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setCancellingApp(null)}
                className="flex-1 py-3 bg-surface-2 border border-border-custom hover:bg-surface-3 rounded-xl text-xs font-bold text-text-primary transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={handleCancel}
                className="flex-1 py-3 bg-danger-custom hover:bg-danger-custom/90 text-text-on-brand rounded-xl text-xs font-extrabold transition-all"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-1 border border-border-custom rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setReschedulingApp(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 bg-surface-2 border border-border-custom rounded-full"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-extrabold text-xl text-text-primary">Reagendar Atendimento</h3>
              <p className="text-text-secondary text-xs">Escolha a nova data e horário com o mesmo profissional.</p>
            </div>

            {/* Date input */}
            <div>
              <label className="block text-text-secondary text-xs font-semibold mb-1.5">Data:</label>
              <input 
                type="date"
                min={new Date().toLocaleDateString("sv-SE")}
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none transition-all"
              />
            </div>

            {/* Slots */}
            <div>
              <label className="block text-text-secondary text-xs font-semibold mb-2">Horários Disponíveis:</label>
              
              {loadingSlots ? (
                <div className="flex justify-center items-center py-6 text-text-muted">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-text-muted text-xs bg-surface-2 p-3 rounded-xl border border-border-custom">Nenhum horário disponível para esta data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {availableSlots.map(s => (
                    <button
                      key={s.startsAt}
                      onClick={() => setRescheduleTime(s.startsAt)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                        rescheduleTime === s.startsAt 
                          ? "bg-brand text-text-on-brand border-brand" 
                          : "bg-surface-2 text-text-primary border-border-custom hover:border-brand"
                      }`}
                    >
                      {s.startsAt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border-custom">
              <button 
                onClick={() => setReschedulingApp(null)}
                className="flex-1 py-3 bg-surface-2 border border-border-custom hover:bg-surface-3 rounded-xl text-xs font-bold text-text-primary transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime}
                className="flex-1 py-3 bg-brand text-text-on-brand hover:bg-brand-hover disabled:bg-surface-2 disabled:text-text-muted rounded-xl text-xs font-extrabold transition-all"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
