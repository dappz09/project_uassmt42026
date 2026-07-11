import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { checkUserLimit } from '@/lib/limits'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const canProceed = await checkUserLimit(userId)

  if (!canProceed) {
    return new Response('Limit harian habis atau tidak aktif', { status: 403 })
  }

  const { prompt } = await req.json()

  if (!prompt) {
    return new Response('Prompt wajib diisi', { status: 400 })
  }

  const result = streamText({
    model: createOpenAI()('gpt-4o-mini'),
    prompt,
  })

  await prisma.usageRecord.create({ data: { userId, action: 'api_call' } })

  return result.toTextStreamResponse()
}
