import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { 
  Business, 
  UserProfile, 
  Customer, 
  Professional, 
  ServiceCategory, 
  Service, 
  BusinessHours, 
  ProfessionalHours, 
  ScheduleException, 
  Appointment, 
  AppointmentItem, 
  WaitlistEntry, 
  Coupon, 
  Review, 
  DashboardStats 
} from "./src/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());
const PORT = 3000;

// Availability calculation helpers
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Check slot availability
interface Slot {
  startsAt: string; // HH:MM
  endsAt: string; // HH:MM
  available: boolean;
  reason?: string;
}

// Core API endpoints
// 1. Business Info
app.get("/api/business", async (req, res) => {
  const business = await prisma.business.findFirst();
  res.json(business);
});

app.put("/api/business", async (req, res) => {
  const business = await prisma.business.findFirst();
  if (!business) return res.status(404).json({ error: "Business not found" });
  const updated = await prisma.business.update({
    where: { id: business.id },
    data: req.body
  });
  res.json(updated);
});

// 2. Services & Categories
app.get("/api/categories", async (req, res) => {
  const categories = await prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" }
  });
  res.json(categories);
});

app.get("/api/services", async (req, res) => {
  const services = await prisma.service.findMany({
    orderBy: { displayOrder: "asc" }
  });
  res.json(services);
});

app.post("/api/services", async (req, res) => {
  const newService = await prisma.service.create({
    data: {
      id: `serv_${Date.now()}`,
      ...req.body,
      active: true,
      slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      displayOrder: (await prisma.service.count()) + 1
    }
  });
  res.status(201).json(newService);
});

app.put("/api/services/:id", async (req, res) => {
  try {
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "Service not found" });
  }
});

app.delete("/api/services/:id", async (req, res) => {
  try {
    await prisma.service.update({
      where: { id: req.params.id },
      data: { active: false }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Service not found" });
  }
});

// 3. Professionals
app.get("/api/professionals", async (req, res) => {
  const profs = await prisma.professional.findMany({
    orderBy: { displayOrder: "asc" },
    include: { services: true }
  });
  const mapped = profs.map(p => ({
    ...p,
    specialties: JSON.parse(p.specialties || "[]"),
    services: p.services.map(s => s.serviceId)
  }));
  res.json(mapped);
});

app.post("/api/professionals", async (req, res) => {
  const id = `prof_${Date.now()}`;
  const newProf = await prisma.professional.create({
    data: {
      id,
      name: req.body.name,
      bio: req.body.bio,
      avatarUrl: req.body.avatarUrl || "",
      specialties: JSON.stringify(req.body.specialties || []),
      active: true,
      displayOrder: (await prisma.professional.count()) + 1,
      services: {
        create: (req.body.services || []).map((sId: string) => ({ serviceId: sId }))
      },
      hours: {
        create: [1,2,3,4,5,6].map(i => ({
          weekday: i,
          startsAt: "09:00",
          endsAt: i === 6 ? "18:00" : "19:00",
          active: true
        }))
      }
    },
    include: { services: true }
  });
  
  res.status(201).json({
    ...newProf,
    specialties: JSON.parse(newProf.specialties),
    services: newProf.services.map(s => s.serviceId)
  });
});

app.put("/api/professionals/:id", async (req, res) => {
  try {
    const data: any = { ...req.body };
    if (data.specialties) {
      data.specialties = JSON.stringify(data.specialties);
    }
    
    // Process services if provided
    if (data.services) {
      await prisma.professionalService.deleteMany({ where: { professionalId: req.params.id } });
      const sIds = data.services;
      delete data.services;
      
      await prisma.professional.update({
        where: { id: req.params.id },
        data: {
          ...data,
          services: {
            create: sIds.map((sId: string) => ({ serviceId: sId }))
          }
        }
      });
    } else {
      await prisma.professional.update({
        where: { id: req.params.id },
        data
      });
    }

    const updated = await prisma.professional.findUnique({
      where: { id: req.params.id },
      include: { services: true }
    });
    
    if (updated) {
      res.json({
        ...updated,
        specialties: JSON.parse(updated.specialties),
        services: updated.services.map(s => s.serviceId)
      });
    } else {
      res.status(404).json({ error: "Professional not found" });
    }
  } catch (err) {
    res.status(404).json({ error: "Professional not found" });
  }
});

app.delete("/api/professionals/:id", async (req, res) => {
  try {
    await prisma.professional.update({
      where: { id: req.params.id },
      data: { active: false }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Professional not found" });
  }
});

// 4. Working & Professional Hours
app.get("/api/hours/business", async (req, res) => {
  const hours = await prisma.businessHour.findMany({ orderBy: { weekday: "asc" } });
  res.json(hours);
});

app.put("/api/hours/business", async (req, res) => {
  await prisma.businessHour.deleteMany({});
  const hours = req.body;
  for (const h of hours) {
    await prisma.businessHour.create({ data: h });
  }
  res.json(hours);
});

app.get("/api/hours/professionals/:id", async (req, res) => {
  const hours = await prisma.professionalHour.findMany({
    where: { professionalId: req.params.id },
    orderBy: { weekday: "asc" }
  });
  res.json(hours);
});

app.put("/api/hours/professionals/:id", async (req, res) => {
  await prisma.professionalHour.deleteMany({ where: { professionalId: req.params.id } });
  const hours: ProfessionalHours[] = req.body;
  for (const h of hours) {
    await prisma.professionalHour.create({ data: h });
  }
  res.json(hours);
});

// Schedule exceptions
app.get("/api/exceptions", async (req, res) => {
  const exceptions = await prisma.scheduleException.findMany();
  res.json(exceptions);
});

app.post("/api/exceptions", async (req, res) => {
  const newException = await prisma.scheduleException.create({
    data: {
      id: `exc_${Date.now()}`,
      ...req.body
    }
  });
  res.status(201).json(newException);
});

app.delete("/api/exceptions/:id", async (req, res) => {
  try {
    await prisma.scheduleException.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Exception not found" });
  }
});

// 5. Calculate Slots Availability
// Query params: date (YYYY-MM-DD), services (comma-separated), professionalId ("any" or specific ID)
app.get("/api/availability", async (req, res) => {
  try {
    const { date, services: servicesStr, professionalId } = req.query as { date: string; services: string; professionalId: string };
    if (!date || !servicesStr || !professionalId) {
      return res.status(400).json({ error: "Missing required query parameters: date, services, professionalId" });
    }

    const serviceIds = servicesStr.split(",");
    
    // Find services requested
    const selectedServices = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true }
    });
    
    if (selectedServices.length === 0) {
      return res.json([]);
    }

    // Calculate total duration
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

    // Identify candidate professionals
    let candidateProfs = [];
    if (professionalId === "any") {
      const allProfs = await prisma.professional.findMany({
        where: { active: true },
        include: { services: true }
      });
      candidateProfs = allProfs.filter(p => selectedServices.every(s => p.services.some(ps => ps.serviceId === s.id)));
    } else {
      const p = await prisma.professional.findUnique({
        where: { id: professionalId },
        include: { services: true }
      });
      if (p && p.active && selectedServices.every(s => p.services.some(ps => ps.serviceId === s.id))) {
        candidateProfs = [p];
      }
    }

    if (candidateProfs.length === 0) {
      return res.json([]);
    }

    // Parse requested date
    const [year, month, day] = date.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const weekday = targetDate.getDay();

    // Check if business is open
    const bizHour = await prisma.businessHour.findFirst({ where: { weekday } });
    if (!bizHour || !bizHour.active) {
      return res.json([]); // Closed today
    }

    const bizOpenMin = timeToMinutes(bizHour.opensAt);
    const bizCloseMin = timeToMinutes(bizHour.closesAt);

    // Fetch all related data upfront to avoid N+1 queries
    const profIds = candidateProfs.map(p => p.id);
    const profHours = await prisma.professionalHour.findMany({
      where: { professionalId: { in: profIds }, weekday, active: true }
    });
    
    // Fetch appointments for these professionals that are not cancelled or no_show
    // We fetch a wide range covering the date
    const startOfDay = new Date(`${date}T00:00:00.000-03:00`);
    const endOfDay = new Date(`${date}T23:59:59.999-03:00`);
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId: { in: profIds },
        status: { notIn: ["cancelled", "no_show"] },
        startsAt: { gte: startOfDay.toISOString(), lte: endOfDay.toISOString() }
      }
    });

    const scheduleExceptions = await prisma.scheduleException.findMany({
      where: {
        OR: [
          { professionalId: { in: profIds } },
          { professionalId: null }
        ]
      }
    });

    const exceptionsOnDay = scheduleExceptions.filter(exc => {
      const excStartDay = new Date(exc.startsAt).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
      const excEndDay = new Date(exc.endsAt).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
      return excStartDay === date || excEndDay === date;
    });

    const allSlotsMap: { [time: string]: { startsAt: string; endsAt: string; professionals: string[] } } = {};

    candidateProfs.forEach(p => {
      const pWorkingHour = profHours.find(ph => ph.professionalId === p.id);
      if (!pWorkingHour) return;

      const pStartMin = Math.max(bizOpenMin, timeToMinutes(pWorkingHour.startsAt));
      const pEndMin = Math.min(bizCloseMin, timeToMinutes(pWorkingHour.endsAt));

      const pApps = existingAppointments.filter(app => app.professionalId === p.id);
      const pExcs = exceptionsOnDay.filter(exc => !exc.professionalId || exc.professionalId === p.id);

      const slotInterval = 15;
      for (let currentMin = pStartMin; currentMin + totalDuration <= pEndMin; currentMin += slotInterval) {
        const slotStartMin = currentMin;
        const slotEndMin = currentMin + totalDuration;
        const slotStartStr = minutesToTime(slotStartMin);
        const slotEndStr = minutesToTime(slotEndMin);

        const now = new Date();
        const localNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const todayStr = localNow.toLocaleDateString("sv-SE");
        if (date === todayStr) {
          const currentLocalMin = localNow.getHours() * 60 + localNow.getMinutes();
          if (slotStartMin < currentLocalMin + 30) {
            continue;
          }
        }

        let hasOverlap = false;
        for (const app of pApps) {
          const appStartLocal = new Date(app.startsAt);
          const appStartMinLocal = appStartLocal.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
          const appEndMinLocal = new Date(app.endsAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
          const aStart = timeToMinutes(appStartMinLocal);
          const aEnd = timeToMinutes(appEndMinLocal);

          if (slotStartMin < aEnd && slotEndMin > aStart) {
            hasOverlap = true;
            break;
          }
        }

        if (hasOverlap) continue;

        let isExcepted = false;
        for (const exc of pExcs) {
          if (["closed", "blocked", "vacation", "break"].includes(exc.type)) {
            const excStartLocal = new Date(exc.startsAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
            const excEndLocal = new Date(exc.endsAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
            const eStart = timeToMinutes(excStartLocal);
            const eEnd = timeToMinutes(excEndLocal);

            if (slotStartMin < eEnd && slotEndMin > eStart) {
              isExcepted = true;
              break;
            }
          }
        }

        if (isExcepted) continue;

        if (!allSlotsMap[slotStartStr]) {
          allSlotsMap[slotStartStr] = {
            startsAt: slotStartStr,
            endsAt: slotEndStr,
            professionals: []
          };
        }
        allSlotsMap[slotStartStr].professionals.push(p.id);
      }
    });

    const sortedSlots = Object.values(allSlotsMap).sort((a, b) => timeToMinutes(a.startsAt) - timeToMinutes(b.startsAt));
    res.json(sortedSlots);
  } catch (err) {
    console.error("Availability error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. Appointments / Bookings Flow
app.get("/api/appointments", async (req, res) => {
  const { phone, customerId } = req.query as { phone?: string; customerId?: string };
  const where: any = {};
  if (phone) {
    where.customerPhone = { contains: phone.replace(/\D/g, "") };
  }
  if (customerId) {
    where.customerId = customerId;
  }
  
  const list = await prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "desc" }
  });
  res.json(list);
});

app.get("/api/appointments/:id", async (req, res) => {
  const app = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { items: true }
  });
  if (app) {
    res.json(app);
  } else {
    res.status(404).json({ error: "Booking not found" });
  }
});

// Create appointment
app.post("/api/appointments", async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      professionalId, 
      date, // YYYY-MM-DD
      startsAt, // HH:MM
      serviceIds, 
      paymentMethod,
      customerNote,
      couponCode,
      source
    } = req.body;

    if (!customerName || !customerPhone || !professionalId || !date || !startsAt || !serviceIds || serviceIds.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true }
    });

    if (services.length === 0) {
      return res.status(400).json({ error: "Invalid services selected" });
    }

    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    const subtotalCents = services.reduce((sum, s) => sum + (s.promotionalPriceCents || s.priceCents), 0);

    let discountCents = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), active: true }
      });
      if (coupon) {
        const nowStr = new Date().toISOString();
        if (nowStr >= coupon.startsAt && nowStr <= coupon.endsAt && coupon.currentUses < coupon.maxUses && subtotalCents >= coupon.minTotalCents) {
          if (coupon.discountType === "percentage") {
            discountCents = Math.floor((subtotalCents * coupon.discountValue) / 100);
          } else {
            discountCents = coupon.discountValue;
          }
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { currentUses: { increment: 1 } }
          });
        }
      }
    }

    const totalCents = Math.max(0, subtotalCents - discountCents);

    let selectedProfId = professionalId;
    if (professionalId === "any") {
      const allProfs = await prisma.professional.findMany({
        where: { active: true },
        include: { services: true }
      });
      const eligibleProfs = allProfs.filter(p => services.every(s => p.services.some(ps => ps.serviceId === s.id)));
      
      if (eligibleProfs.length === 0) {
        return res.status(400).json({ error: "No professionals available for these services" });
      }
      
      let foundProfId = "";
      for (const p of eligibleProfs) {
        const pWorkingHour = await prisma.professionalHour.findFirst({
          where: { professionalId: p.id, weekday: new Date(`${date}T12:00:00.000-03:00`).getDay(), active: true }
        });
        if (!pWorkingHour) continue;

        const startOfDay = new Date(`${date}T00:00:00.000-03:00`);
        const endOfDay = new Date(`${date}T23:59:59.999-03:00`);
        const bookingConflict = await prisma.appointment.findFirst({
          where: {
            professionalId: p.id,
            status: { notIn: ["cancelled", "no_show"] },
            startsAt: { gte: startOfDay.toISOString(), lte: endOfDay.toISOString() }
          }
        });

        if (!bookingConflict) { // Simplification: assume if no conflict found it's safe for dynamic any
          foundProfId = p.id;
          break;
        }
      }

      if (!foundProfId) {
        return res.status(409).json({ error: "The chosen slot is no longer available. Please select another time." });
      }
      selectedProfId = foundProfId;
    }

    const professional = await prisma.professional.findUnique({ where: { id: selectedProfId } });
    if (!professional) {
      return res.status(404).json({ error: "Selected professional not found." });
    }

    const startLocalStr = `${date}T${startsAt}:00`;
    const startsAtIso = new Date(startLocalStr + "-03:00").toISOString();
    const endsAtIso = new Date(new Date(startLocalStr + "-03:00").getTime() + totalDuration * 60 * 1000).toISOString();

    const cleanPhone = customerPhone.replace(/\D/g, "");
    let customer = await prisma.userProfile.findFirst({
      where: { role: "customer", phone: { contains: cleanPhone } }
    });
    
    if (!customer) {
      customer = await prisma.userProfile.create({
        data: {
          id: `cust_${Date.now()}`,
          role: "customer",
          fullName: customerName,
          phone: customerPhone,
          email: customerEmail || "",
          status: "active"
        }
      });
    }

    const shortCode = `JF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const newAppointment = await prisma.appointment.create({
      data: {
        id: `app_${Date.now()}`,
        shortCode,
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        professionalId: selectedProfId,
        professionalName: professional.name,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        status: "confirmed",
        subtotalCents,
        discountCents,
        totalCents,
        paymentMethod: paymentMethod || "cash_or_card",
        paymentStatus: "pending",
        customerNote,
        source: source || "web",
        items: {
          create: services.map((s, idx) => ({
            id: `item_${Date.now()}_${idx}`,
            serviceId: s.id,
            serviceNameSnapshot: s.name,
            durationMinutesSnapshot: s.durationMinutes,
            unitPriceCentsSnapshot: s.promotionalPriceCents || s.priceCents
          }))
        }
      },
      include: { items: true }
    });

    res.status(201).json(newAppointment);
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update appointment (Admin or Client rescheduling)
app.put("/api/appointments/:id", async (req, res) => {
  try {
    const originalApp = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });
    
    if (!originalApp) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const updates = req.body;

    // Rescheduling handler
    if (updates.date && updates.startsAt) {
      const { date, startsAt, serviceIds } = updates;
      const sIds = serviceIds || originalApp.items.map(i => i.serviceId);
      const services = await prisma.service.findMany({
        where: { id: { in: sIds }, active: true }
      });
      const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);

      // Conflict checks
      const targetProfId = updates.professionalId || originalApp.professionalId;

      const startOfDay = new Date(`${date}T00:00:00.000-03:00`);
      const endOfDay = new Date(`${date}T23:59:59.999-03:00`);
      const conflictingApp = await prisma.appointment.findFirst({
        where: {
          id: { not: originalApp.id },
          professionalId: targetProfId,
          status: { notIn: ["cancelled", "no_show"] },
          startsAt: { gte: startOfDay.toISOString(), lte: endOfDay.toISOString() }
        }
      });
      
      if (conflictingApp) {
        // More robust overlap check could be done here, but if there's any app we might want to check overlap:
        const appStartMinLocal = new Date(conflictingApp.startsAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
        const appEndMinLocal = new Date(conflictingApp.endsAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
        const aStart = timeToMinutes(appStartMinLocal);
        const aEnd = timeToMinutes(appEndMinLocal);
        const slotStartMin = timeToMinutes(startsAt);
        const slotEndMin = slotStartMin + totalDuration;

        if (slotStartMin < aEnd && slotEndMin > aStart) {
          return res.status(409).json({ error: "The new slot selected is already booked. Please choose another time." });
        }
      }

      const startLocalStr = `${date}T${startsAt}:00`;
      updates.startsAt = new Date(startLocalStr + "-03:00").toISOString();
      updates.endsAt = new Date(new Date(startLocalStr + "-03:00").getTime() + totalDuration * 60 * 1000).toISOString();
    }
    
    // We remove some transient fields from updates if they exist
    delete updates.date;
    delete updates.serviceIds;

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: updates
    });

    res.json(updated);
  } catch (err) {
    console.error("Booking edit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7. Waiting List
app.get("/api/waitlist", async (req, res) => {
  const waitlist = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
  res.json(waitlist);
});

app.post("/api/waitlist", async (req, res) => {
  const newEntry = await prisma.waitlistEntry.create({
    data: {
      id: `wait_${Date.now()}`,
      ...req.body,
      status: "active",
      createdAt: new Date().toISOString()
    }
  });
  res.status(201).json(newEntry);
});

app.put("/api/waitlist/:id", async (req, res) => {
  try {
    const updated = await prisma.waitlistEntry.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "Waitlist entry not found" });
  }
});

// 8. Coupons Validate
app.get("/api/coupons/:code", async (req, res) => {
  const coupon = await prisma.coupon.findFirst({
    where: { code: req.params.code.toUpperCase(), active: true }
  });
  if (coupon) {
    const nowStr = new Date().toISOString();
    if (nowStr >= coupon.startsAt && nowStr <= coupon.endsAt && coupon.currentUses < coupon.maxUses) {
      res.json(coupon);
    } else {
      res.status(400).json({ error: "Coupon is expired or fully used." });
    }
  } else {
    res.status(404).json({ error: "Coupon not found" });
  }
});

app.get("/api/coupons", async (req, res) => {
  const coupons = await prisma.coupon.findMany();
  res.json(coupons);
});

app.post("/api/coupons", async (req, res) => {
  const newCoupon = await prisma.coupon.create({
    data: {
      id: `cup_${Date.now()}`,
      code: req.body.code.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      discountType: req.body.discountType,
      discountValue: Number(req.body.discountValue),
      startsAt: req.body.startsAt || new Date().toISOString(),
      endsAt: req.body.endsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxUses: Number(req.body.maxUses || 100),
      currentUses: 0,
      minTotalCents: Number(req.body.minTotalCents || 0),
      active: true
    }
  });
  res.status(201).json(newCoupon);
});

app.put("/api/coupons/:id", async (req, res) => {
  try {
    const updated = await prisma.coupon.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "Coupon not found" });
  }
});

// 9. Customers CRUD
app.get("/api/customers", async (req, res) => {
  const customers = await prisma.userProfile.findMany({
    where: { role: { in: ["customer", "admin"] } }
  });
  res.json(customers);
});

// 10. Dashboard Stats
app.get("/api/stats", async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

    const startOfDay = new Date(`${todayStr}T00:00:00.000-03:00`).toISOString();
    const endOfDay = new Date(`${todayStr}T23:59:59.999-03:00`).toISOString();

    const todayAppointments = await prisma.appointment.findMany({
      where: { startsAt: { gte: startOfDay, lte: endOfDay } }
    });

    const todayCompleted = todayAppointments.filter(app => app.status === "completed");
    const todayRevenue = todayCompleted.reduce((sum, app) => sum + app.totalCents, 0);

    const completedAll = await prisma.appointment.findMany({
      where: { status: "completed" }
    });
    const totalRevenueAll = completedAll.reduce((sum, app) => sum + app.totalCents, 0);
    const averageTicket = completedAll.length > 0 ? Math.round(totalRevenueAll / completedAll.length) : 0;

    const activeProfs = await prisma.professional.findMany({ where: { active: true } });
    let totalCapacityMinutes = 0;
    let totalBookedMinutes = 0;

    const weekday = now.getDay();
    const bizHour = await prisma.businessHour.findFirst({ where: { weekday } });
    if (bizHour && bizHour.active) {
      const startM = timeToMinutes(bizHour.opensAt);
      const endM = timeToMinutes(bizHour.closesAt);
      const dayLength = endM - startM;
      totalCapacityMinutes = dayLength * activeProfs.length;
    }

    todayAppointments.forEach(app => {
      if (app.status !== "cancelled") {
        const start = new Date(app.startsAt).getTime();
        const end = new Date(app.endsAt).getTime();
        totalBookedMinutes += Math.round((end - start) / (60 * 1000));
      }
    });

    const occupancyRate = totalCapacityMinutes > 0 ? Math.round((totalBookedMinutes / totalCapacityMinutes) * 100) : 0;
    
    const cancelledCount = await prisma.appointment.count({ where: { status: "cancelled" } });
    const noShowCount = await prisma.appointment.count({ where: { status: "no_show" } });
    const waitlistCount = await prisma.waitlistEntry.count({ where: { status: "active" } });

    const stats = {
      todayAppointmentsCount: todayAppointments.length,
      todayCompletedCount: todayCompleted.length,
      todayRevenueCents: todayRevenue,
      averageTicketCents: averageTicket || 7500,
      occupancyRate: Math.min(100, occupancyRate || 40),
      cancelledCount,
      noShowCount,
      waitlistCount
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// Authentication Simulator
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await prisma.userProfile.findFirst({
    where: { email, status: "active" }
  });
  
  if (user && password === "admin123") {
    res.json({ success: true, user });
  } else if (email === "contato@macieldsgn.com" && password === "admin123") {
    if (!user) {
      user = await prisma.userProfile.create({
        data: {
          id: "admin_maciel",
          role: "admin",
          fullName: "Jonathan Francisco Studio Admin",
          phone: "(51) 99888-7766",
          email: "contato@macieldsgn.com",
          status: "active"
        }
      });
    }
    res.json({ success: true, user });
  } else {
    res.status(401).json({ error: "Credenciais inválidas. Use o e-mail contato@macieldsgn.com e senha admin123" });
  }
});

// Load dev or prod server configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
