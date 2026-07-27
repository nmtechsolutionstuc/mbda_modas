import { Request, Response } from 'express'
import { z } from 'zod'
import { ok } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { adminListListings, approveListing, rejectListing, deleteListingAdmin } from '../services/listing.service'

export const listListingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  })
  const q = schema.parse(req.query)
  const result = await adminListListings(q)
  ok(res, result)
})

export const approveListingAction = asyncHandler(async (req: Request, res: Response) => {
  const listing = await approveListing(req.params.id)
  ok(res, listing)
})

export const rejectListingAction = asyncHandler(async (req: Request, res: Response) => {
  const listing = await rejectListing(req.params.id)
  ok(res, listing)
})

export const deleteListingAction = asyncHandler(async (req: Request, res: Response) => {
  await deleteListingAdmin(req.params.id)
  ok(res, { id: req.params.id })
})
