import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { hashPassword } from '../services/auth.service'
import { ok, created, conflict, notFound } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'

// ── Listar subadmins ──────────────────────────────────────────────────────────

export const listSubAdmins = asyncHandler(async (_req: Request, res: Response) => {
  const subadmins = await prisma.admin.findMany({
    where: { role: 'SUBADMIN' },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  ok(res, subadmins)
})

// ── Crear subadmin ────────────────────────────────────────────────────────────

const CreateSubAdminSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export const createSubAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = CreateSubAdminSchema.parse(req.body)

  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) { conflict(res, 'El email ya está registrado'); return }

  const passwordHash = await hashPassword(password)
  const subadmin = await prisma.admin.create({
    data: { name, email, passwordHash, role: 'SUBADMIN' },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  })

  created(res, subadmin)
})

// ── Toggle activo/inactivo ────────────────────────────────────────────────────

export const toggleSubAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const subadmin = await prisma.admin.findUnique({ where: { id } })
  if (!subadmin || subadmin.role !== 'SUBADMIN') {
    notFound(res, 'Subadmin no encontrado')
    return
  }

  const updated = await prisma.admin.update({
    where: { id },
    data: { isActive: !subadmin.isActive },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  })

  ok(res, updated)
})
