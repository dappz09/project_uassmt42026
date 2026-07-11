import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export function successResponse<T>(data: T, message: string = 'Success', status: number = 200) {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    message,
    data,
  }, { status })
}

export function errorResponse(message: string = 'Internal server error', status: number = 500, error?: string) {
  return NextResponse.json<ApiResponse>({
    success: false,
    message,
    error,
  }, { status })
}
