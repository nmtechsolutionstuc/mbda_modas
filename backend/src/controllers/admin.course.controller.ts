import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { ok, created, badRequest, notFound } from '../utils/apiResponse'
import { validateYoutubeUrl } from '../utils/youtube'
import { stripHtml, sanitizeStrings } from '../utils/sanitize'

const CourseVideoSchema = z.object({
  title: z.string().min(1).max(120),
  youtubeUrl: z.string().min(1),
  description: z.string().max(1000).optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
})

const UpdateCourseVideoSchema = CourseVideoSchema.partial()

export async function listCourseVideosHandler(_req: Request, res: Response): Promise<void> {
  const videos = await prisma.courseVideo.findMany({ orderBy: { order: 'asc' } })
  ok(res, videos)
}

export async function createCourseVideoHandler(req: Request, res: Response): Promise<void> {
  const parsed = CourseVideoSchema.parse(req.body)
  const urlCheck = validateYoutubeUrl(parsed.youtubeUrl)
  if (!urlCheck.valid) { badRequest(res, urlCheck.error!); return }

  const data = {
    ...sanitizeStrings(parsed) as typeof parsed,
    title: stripHtml(parsed.title),
    description: parsed.description ? stripHtml(parsed.description) : parsed.description,
  }
  const video = await prisma.courseVideo.create({ data })
  created(res, video)
}

export async function updateCourseVideoHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const parsed = UpdateCourseVideoSchema.parse(req.body)

  if (parsed.youtubeUrl !== undefined) {
    const urlCheck = validateYoutubeUrl(parsed.youtubeUrl)
    if (!urlCheck.valid) { badRequest(res, urlCheck.error!); return }
  }

  const data = {
    ...sanitizeStrings(parsed) as typeof parsed,
    ...(parsed.title !== undefined && { title: stripHtml(parsed.title) }),
    ...(parsed.description !== undefined && { description: stripHtml(parsed.description) }),
  }

  try {
    const video = await prisma.courseVideo.update({ where: { id }, data })
    ok(res, video)
  } catch {
    notFound(res, 'Video no encontrado')
  }
}

export async function deleteCourseVideoHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  try {
    await prisma.courseVideo.delete({ where: { id } })
    ok(res, { id })
  } catch {
    notFound(res, 'Video no encontrado')
  }
}
