"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { LoginValues } from "../lib/schema";

export function useLogin() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function login(_values: LoginValues) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      // TODO: replace with Convex/API auth call
      // await api.auth.login(values);
      router.push("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return { login, isSubmitting, serverError };
}
