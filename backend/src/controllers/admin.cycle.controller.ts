import { Request, Response } from 'express'
import { z } from 'zod'
import { ok, created } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { listCycles, getCycleDetail, createCycle, updateCycleStatus, updateCycleDates, getCycleShippingSummary } from '../services/cycle.service'

export const listCyclesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const cycles = await listCycles()
  ok(res, cycles)
})

export const getCycleHandler = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await getCycleDetail(req.params.id)
  ok(res, cycle)
})

export const getCycleShippingHandler = asyncHandler(async (req: Request, res: Response) => {
  const summary = await getCycleShippingSummary(req.params.id)
  ok(res, summary)
})

const CreateCycleSchema = z.object({
  closeAt: z.coerce.date(),
  dispatchAt: z.coerce.date(),
})

export const createCycleHandler = asyncHandler(async (req: Request, res: Response) => {
  const { closeAt, dispatchAt } = CreateCycleSchema.parse(req.body)
  const cycle = await createCycle(closeAt, dispatchAt)
  created(res, cycle)
})

const UpdateCycleStatusSchema = z.object({
  status: z.enum(['CLOSED', 'PREPARING', 'DISPATCHED']),
})

export const updateCycleStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { status } = UpdateCycleStatusSchema.parse(req.body)
  const cycle = await updateCycleStatus(req.params.id, status)
  ok(res, cycle)
})

const UpdateCycleDatesSchema = z.object({
  closeAt: z.coerce.date(),
  dispatchAt: z.coerce.date(),
})

export const updateCycleDatesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { closeAt, dispatchAt } = UpdateCycleDatesSchema.parse(req.body)
  const cycle = await updateCycleDates(req.params.id, closeAt, dispatchAt)
  ok(res, cycle)
})
