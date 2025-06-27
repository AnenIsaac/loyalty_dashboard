// types/auth.ts
export interface SignUpData {
    email: string
    password: string
    businessName?: string
    phone: string
  }
  
  export interface SignInData {
    email: string
    password: string
  }
  
  export interface AuthError {
    message: string
    field?: string
  }
  