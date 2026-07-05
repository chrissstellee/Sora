"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { RegisterValues } from "../lib/schema";

export function useRegister() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function register(_values: RegisterValues) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      // TODO: replace with Convex/API auth call
      // await api.auth.register(values);
      router.push("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return { register, isSubmitting, serverError };
}
