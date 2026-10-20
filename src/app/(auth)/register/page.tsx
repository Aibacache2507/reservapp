"use client";

import * as React from "react";
import Link from "next/link";
import { signUpWithEmail, signInWithGoogle, type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = React.useActionState<AuthState, FormData>(
    signUpWithEmail,
    {}
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-600 text-white shadow-lg shadow-pink-200 dark:shadow-none mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            RESERV<span className="text-pink-600">APP</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Crea tu cuenta y empieza a recibir reservas en minutos
          </p>
        </div>

        <Card className="border-neutral-200 dark:border-neutral-800 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Crear cuenta</CardTitle>
            <CardDescription>
              Regístrate como dueño de negocio o profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {state?.success && (
              <div className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{state.success}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" required>
                  Nombre completo
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Ej. Camila Silva"
                  prefixNode={<User className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Teléfono / WhatsApp (Chile)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  prefixNode={<Phone className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" required>
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contacto@tunegocio.cl"
                  prefixNode={<Mail className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" required>
                  Contraseña (mínimo 6 caracteres)
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  prefixNode={<Lock className="w-4 h-4" />}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                isLoading={isPending}
              >
                Crear mi cuenta y continuar
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-500">
                  O regístrate con
                </span>
              </div>
            </div>

            <form action={signInWithGoogle}>
              <Button
                type="submit"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Registrarme con Google
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-neutral-500">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="ml-1 text-pink-600 font-medium hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
