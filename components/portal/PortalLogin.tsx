"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/portal/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: LoginState = { error: null };

export function PortalLogin() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="p-2">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={18} className="text-purple-500" />
              <CardTitle className="text-xl">Client Portal</CardTitle>
            </div>
            <CardDescription>
              Enter your website domain and password to manage your files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="domain" className="text-sm text-muted-foreground">
                  Website domain
                </label>
                <input
                  id="domain"
                  name="domain"
                  type="text"
                  placeholder="yourdomain.com"
                  autoComplete="username"
                  required
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm text-muted-foreground">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <Button type="submit" disabled={pending} className="mt-2 w-full">
                {pending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
