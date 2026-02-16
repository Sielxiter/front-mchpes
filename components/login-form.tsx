"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { login, googleStart, redirectForRole } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      return
    }

    try {
      setIsSubmitting(true)
      const user = await login(email, password)
      router.replace(redirectForRole(user.role))
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = () => {
    if (isGoogleLoading) {
      return
    }

    setIsGoogleLoading(true)
    googleStart()
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" name="password" type="password" required />
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting || isGoogleLoading}>
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting || isGoogleLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.626 32.659 29.154 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.965 3.034l5.657-5.657C34.747 6.053 29.616 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917Z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691 12.91 19.53C14.602 16.054 18.059 14 24 14c3.059 0 5.842 1.154 7.965 3.034l5.657-5.657C34.747 6.053 29.616 4 24 4c-7.682 0-14.367 4.33-17.694 10.691Z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.046 0 9.68-1.934 13.22-5.088l-6.103-5.162C29.154 36 24 36 24 36c-5.132 0-9.59-3.315-11.279-7.946l-6.517 5.02C9.505 39.556 16.227 44 24 44Z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-1.046 2.958-3.224 5.456-6.183 6.75h.002l6.103 5.162C34.789 40.318 44 35 44 24c0-1.341-.138-2.651-.389-3.917Z"
              />
            </svg>
            {isGoogleLoading ? "Signing in..." : "Login with Google"}
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
