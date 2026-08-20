import React, { useState, useEffect } from "react";
import { X, Check, Hourglass, AlertCircle } from "lucide-react";
import { Service, Professional } from "../types";

interface WaitlistFormProps {
  initialDate?: string;
  initialServices?: string[];
  initialProfId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WaitlistForm({ initialDate, initialServices, initialProfId, onClose, onSuccess }: WaitlistFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState(initialDate || new Date().toLocaleDateString("sv-SE"));
  const [preferredPeriods, setPreferredPeriods] = useState<('morning' | 'afternoon' | 'evening')[]>(["afternoon"]);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServices || []);
  const [selectedProf, setSelectedProf] = useState<string>(initialProfId || "any");

  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFormMetadata() {
      try {
        const [sRes, pRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/professionals")
        ]);
        const sData = await sRes.json();
        const pData = await pRes.json();
        setServices(sData.filter((s: Service) => s.active));
        setProfessionals(pData.filter((p: Professional) => p.active));
      } catch (err) {
        console.error(err);
      }
    }
    loadFormMetadata();
  }, []);

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
    setCustomerPhone(val);
  };

  const handleTogglePeriod = (p: 'morning' | 'afternoon' | 'evening') => {
    if (preferredPeriods.includes(p)) {
      setPreferredPeriods(preferredPeriods.filter(x => x !== p));
    } else {
      setPreferredPeriods([...preferredPeriods, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || customerPhone.length < 14 || selectedServices.length === 0) {
      setError("Por favor, preencha todos os dados obrigatórios.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          preferredDateStart: preferredDate,
          preferredDateEnd: preferredDate,
          preferredPeriods,
          professionalId: selectedProf === "any" ? undefined : selectedProf,
          serviceIds: selectedServices
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError("Erro ao se cadastrar na fila de espera.");
      }
    } catch (err) {
      setError("Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-1 border border-border-custom rounded-2xl p-6 space-y-4 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 bg-surface-2 border border-border-custom rounded-full"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 border-b border-border-custom pb-3">
          <Hourglass size={20} className="text-brand" />
          <div>
            <h3 className="font-display font-extrabold text-lg text-text-primary">Fila de Espera Premium</h3>
            <p className="text-text-secondary text-xs">Seremos avisados assim que um horário de desistência surgir.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary font-semibold mb-1">Seu Nome *</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Pedro Silva"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-semibold mb-1">WhatsApp / Celular *</label>
              <input 
                type="text" 
                required
                placeholder="(51) 99999-9999"
                value={customerPhone}
                onChange={handlePhoneChange}
                className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary font-semibold mb-1">Data Desejada *</label>
              <input 
                type="date" 
                required
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-semibold mb-1">Barbeiro Preferido</label>
              <select 
                value={selectedProf}
                onChange={e => setSelectedProf(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-border-custom text-text-primary text-xs focus:border-brand focus:outline-none"
              >
                <option value="any">Qualquer Barbeiro Disponível</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-1.5">Períodos de Preferência (Selecione ao menos um)</label>
            <div className="flex gap-2">
              {(["morning", "afternoon", "evening"] as const).map(p => {
                const labelMap = { morning: "Manhã", afternoon: "Tarde", evening: "Noite" };
                const isSelected = preferredPeriods.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleTogglePeriod(p)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected 
                        ? "bg-brand text-text-on-brand border-brand" 
                        : "bg-surface-2 text-text-primary border-border-custom hover:border-brand"
                    }`}
                  >
                    {labelMap[p]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-1.5">Serviços Desejados *</label>
            <div className="grid grid-cols-2 gap-2 max-h-[100px] overflow-y-auto pr-1">
              {services.map(s => (
                <label key={s.id} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg border border-border-custom cursor-pointer text-[10px]">
                  <input 
                    type="checkbox"
                    checked={selectedServices.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServices([...selectedServices, s.id]);
                      } else {
                        setSelectedServices(selectedServices.filter(id => id !== s.id));
                      }
                    }}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-danger-custom font-semibold flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}

          <div className="flex gap-2 pt-2 border-t border-border-custom">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-surface-2 hover:bg-surface-3 border border-border-custom rounded-xl font-bold text-text-primary"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-brand text-text-on-brand hover:bg-brand-hover rounded-xl font-extrabold"
            >
              {submitting ? "Cadastrando..." : "Cadastrar na Fila"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
