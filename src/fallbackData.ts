import { Business, ServiceCategory, Service, Professional } from "./types";

export const DEFAULT_BUSINESS: Business = {
  id: "biz_jonathan",
  name: "Jonathan Francisco Studio",
  slug: "jonathan-francisco-studio",
  phone: "(51) 99888-7766",
  whatsapp: "(51) 99888-7766",
  email: "contato@macieldsgn.com",
  instagramUrl: "https://instagram.com/jonathanfranciscostudio",
  address: "R. Joaquim Nabuco, 828 — Centro, Novo Hamburgo — RS, 93310-002",
  timezone: "America/Sao_Paulo",
  logoUrl: "",
  coverUrl: "",
  status: "active"
};

export const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: "cat_corte", name: "Corte", slug: "corte", displayOrder: 1, active: true },
  { id: "cat_barba", name: "Barba", slug: "barba", displayOrder: 2, active: true },
  { id: "cat_combos", name: "Combos", slug: "combos", displayOrder: 3, active: true },
  { id: "cat_outros", name: "Acabamentos", slug: "acabamentos", displayOrder: 4, active: true }
];

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "serv_corte",
    categoryId: "cat_corte",
    name: "Corte Masculino Sênior",
    slug: "corte-masculino",
    shortDescription: "Corte moderno, lavagem e finalização premium.",
    description: "Corte personalizado de alta precisão com lavagem refrescante, massagem capilar e finalização com pomadas Noir Signal.",
    durationMinutes: 45,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    priceCents: 6000,
    onlineBookingEnabled: true,
    active: true,
    displayOrder: 1
  },
  {
    id: "serv_barba",
    categoryId: "cat_barba",
    name: "Barba Terapia Noir",
    slug: "barba-terapia",
    shortDescription: "Barbear clássico com toalha quente e massagem.",
    description: "Barbeamento tradicional com navalha, esfoliação, massagem facial, óleo hidratante e toalha quente aromática.",
    durationMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    priceCents: 4500,
    onlineBookingEnabled: true,
    active: true,
    displayOrder: 2
  },
  {
    id: "serv_corte_barba",
    categoryId: "cat_combos",
    name: "Combo Imperial (Corte + Barba)",
    slug: "combo-imperial",
    shortDescription: "O visual completo com desconto exclusivo.",
    description: "Nosso serviço mais pedido. Unimos o Corte Sênior com a Barba Terapia Noir em uma sessão de puro estilo.",
    durationMinutes: 75,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 10,
    priceCents: 9500,
    promotionalPriceCents: 9000,
    onlineBookingEnabled: true,
    active: true,
    displayOrder: 3
  },
  {
    id: "serv_corte_sobrancelha",
    categoryId: "cat_outros",
    name: "Corte + Sobrancelha",
    slug: "corte-sobrancelha",
    shortDescription: "Corte completo e design de sobrancelha na navalha.",
    description: "Corte sênior de cabelo aliado ao alinhamento preciso das sobrancelhas com navalha para uma expressão mais forte.",
    durationMinutes: 45,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    priceCents: 7500,
    onlineBookingEnabled: true,
    active: true,
    displayOrder: 4
  },
  {
    id: "serv_combo_completo",
    categoryId: "cat_combos",
    name: "Noir Legend (Corte + Barba + Sobrancelha)",
    slug: "combo-noir-legend",
    shortDescription: "A experiência premium definitiva do estúdio.",
    description: "O pacote completo. Cabelo lavado e modelado, barba relaxante com toalha quente e design profissional de sobrancelha.",
    durationMinutes: 90,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 10,
    priceCents: 12000,
    promotionalPriceCents: 11000,
    onlineBookingEnabled: true,
    active: true,
    displayOrder: 5
  }
];

export const DEFAULT_PROFESSIONALS: Professional[] = [
  {
    id: "prof_jonathan",
    name: "Jonathan Francisco",
    bio: "Criador do estúdio, visagista e barbeiro sênior especializado em tesoura clássica e cortes modernos.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    specialties: ["Cortes Clássicos", "Visagismo", "Navalha Livre"],
    services: ["serv_corte", "serv_barba", "serv_corte_barba", "serv_corte_sobrancelha", "serv_combo_completo"],
    active: true,
    displayOrder: 1
  },
  {
    id: "prof_marcus",
    name: "Marcus Vinícius",
    bio: "Especialista em fade degradê, barboterapia de alta performance e técnicas de texturização capilar.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
    specialties: ["Degradê Navalhado", "Barboterapia", "Hair Tattoo"],
    services: ["serv_corte", "serv_barba", "serv_corte_barba", "serv_corte_sobrancelha", "serv_combo_completo"],
    active: true,
    displayOrder: 2
  }
];

// Fallback hourly slots for static-only environments
export const DEFAULT_SLOTS = [
  { startsAt: "09:00", endsAt: "09:45", professionals: ["prof_jonathan", "prof_marcus"] },
  { startsAt: "10:00", endsAt: "10:45", professionals: ["prof_jonathan", "prof_marcus"] },
  { startsAt: "11:00", endsAt: "11:45", professionals: ["prof_jonathan", "prof_marcus"] },
  { startsAt: "13:00", endsAt: "13:45", professionals: ["prof_jonathan", "prof_marcus"] },
  { startsAt: "14:00", endsAt: "14:45", professionals: ["prof_jonathan", "prof_marcus"] },
  { startsAt: "15:00", endsAt: "15:45", professionals: ["prof_jonathan", "prof_marcus"] },
  { startsAt: "16:00", endsAt: "16:45", professionals: ["prof_jonathan", "prof_marcus"] },
  { startsAt: "17:00", endsAt: "17:45", professionals: ["prof_jonathan", "prof_marcus"] }
];
