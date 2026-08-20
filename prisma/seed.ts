import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs'
import path from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const dbFile = path.join(process.cwd(), 'database.json')
  if (!fs.existsSync(dbFile)) {
    console.log('No database.json found. Skipping seed.')
    return
  }
  
  const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'))
  
  console.log('Starting seed...')
  
  if (data.business) {
    await prisma.business.upsert({
      where: { id: data.business.id },
      update: {},
      create: {
        id: data.business.id,
        name: data.business.name,
        slug: data.business.slug,
        phone: data.business.phone,
        whatsapp: data.business.whatsapp,
        email: data.business.email,
        instagramUrl: data.business.instagramUrl,
        address: data.business.address,
        timezone: data.business.timezone,
        logoUrl: data.business.logoUrl || null,
        coverUrl: data.business.coverUrl || null,
        status: data.business.status,
      }
    })
  }

  if (data.users) {
    for (const u of data.users) {
      await prisma.userProfile.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          role: u.role,
          fullName: u.fullName,
          phone: u.phone,
          email: u.email,
          avatarUrl: u.avatarUrl || null,
          status: u.status,
        }
      })
    }
  }

  if (data.categories) {
    for (const cat of data.categories) {
      await prisma.serviceCategory.upsert({
        where: { id: cat.id },
        update: {},
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          displayOrder: cat.displayOrder,
          active: cat.active,
        }
      })
    }
  }

  if (data.services) {
    for (const s of data.services) {
      await prisma.service.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          categoryId: s.categoryId,
          name: s.name,
          slug: s.slug,
          shortDescription: s.shortDescription,
          description: s.description,
          imageUrl: s.imageUrl || null,
          durationMinutes: s.durationMinutes,
          bufferBeforeMinutes: s.bufferBeforeMinutes,
          bufferAfterMinutes: s.bufferAfterMinutes,
          priceCents: s.priceCents,
          promotionalPriceCents: s.promotionalPriceCents || null,
          onlineBookingEnabled: s.onlineBookingEnabled,
          active: s.active,
          displayOrder: s.displayOrder,
        }
      })
    }
  }

  if (data.professionals) {
    for (const p of data.professionals) {
      await prisma.professional.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          name: p.name,
          bio: p.bio,
          avatarUrl: p.avatarUrl || '',
          specialties: JSON.stringify(p.specialties || []),
          active: p.active,
          displayOrder: p.displayOrder,
        }
      })
      
      if (p.services) {
        for (const sId of p.services) {
          await prisma.professionalService.upsert({
            where: {
              professionalId_serviceId: {
                professionalId: p.id,
                serviceId: sId
              }
            },
            update: {},
            create: {
              professionalId: p.id,
              serviceId: sId
            }
          })
        }
      }
    }
  }

  if (data.businessHours) {
    for (const bh of data.businessHours) {
      await prisma.businessHour.create({
        data: {
          weekday: bh.weekday,
          opensAt: bh.opensAt,
          closesAt: bh.closesAt,
          active: bh.active,
        }
      })
    }
  }

  if (data.professionalHours) {
    for (const ph of data.professionalHours) {
      try {
        await prisma.professionalHour.create({
          data: {
            professionalId: ph.professionalId,
            weekday: ph.weekday,
            startsAt: ph.startsAt,
            endsAt: ph.endsAt,
            active: ph.active,
          }
        })
      } catch (e) {
        console.warn(`Skipped orphaned professionalHour for ${ph.professionalId}`)
      }
    }
  }

  if (data.coupons) {
    for (const c of data.coupons) {
      await prisma.coupon.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          startsAt: c.startsAt,
          endsAt: c.endsAt,
          maxUses: c.maxUses,
          currentUses: c.currentUses,
          minTotalCents: c.minTotalCents,
          active: c.active,
        }
      })
    }
  }
  
  if (data.appointments) {
    for (const app of data.appointments) {
      await prisma.appointment.upsert({
        where: { id: app.id },
        update: {},
        create: {
          id: app.id,
          shortCode: app.shortCode,
          customerId: app.customerId,
          customerName: app.customerName,
          customerPhone: app.customerPhone,
          customerEmail: app.customerEmail || null,
          professionalId: app.professionalId,
          professionalName: app.professionalName,
          startsAt: app.startsAt,
          endsAt: app.endsAt,
          status: app.status,
          subtotalCents: app.subtotalCents,
          discountCents: app.discountCents,
          totalCents: app.totalCents,
          paymentMethod: app.paymentMethod,
          paymentStatus: app.paymentStatus,
          customerNote: app.customerNote || null,
          internalNote: app.internalNote || null,
          source: app.source,
          cancellationReason: app.cancellationReason || null,
          cancelledAt: app.cancelledAt || null,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        }
      })
    }
  }
  
  if (data.appointmentItems) {
    for (const item of data.appointmentItems) {
      await prisma.appointmentItem.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          appointmentId: item.appointmentId,
          serviceId: item.serviceId,
          serviceNameSnapshot: item.serviceNameSnapshot,
          durationMinutesSnapshot: item.durationMinutesSnapshot,
          unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
        }
      })
    }
  }

  console.log('Seed completed successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
