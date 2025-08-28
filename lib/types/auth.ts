export type LoginCredentials = {
  email: string
  password: string
}

export type LoginResponse = {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
    name: string
  }
}

export type FormErrors = {
  email?: string
  password?: string
  general?: string
}
