"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { InputGroup, InputGroupInput } from "@repo/ui/components/ui/input-group";

import { useAuth } from "../../hooks/use-auth";

const onboardSchema = z.object({
  organization: z.string().min(2, "Enter your organization name"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  agreeToTerms: z.boolean().refine((value) => value === true, {
    message: "You must agree to the demonstration policy",
  }),
});

type OnboardValues = z.infer<typeof onboardSchema>;

const labelClass = "text-xs font-medium tracking-widest text-muted-foreground uppercase";

export function RegisterForm() {
  const router = useRouter();
  const { authState, onboard, error } = useAuth();

  const form = useForm<OnboardValues>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      organization: "",
      email: "",
      agreeToTerms: false,
    },
  });

  // Redirect to login if user is not in the onboarding-required state
  useEffect(() => {
    if (
      authState !== "onboarding-required" &&
      authState !== "verifying" &&
      authState !== "authenticated"
    ) {
      router.push("/login");
    }
  }, [authState, router]);

  const onSubmit = async (values: OnboardValues) => {
    await onboard(values.organization, values.email || undefined);
  };

  const isSubmitting = authState === "verifying";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Organization Name</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput placeholder="Acme Tokenized Assets" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                Contact Email{" "}
                <span className="text-[10px] font-normal tracking-normal text-muted-foreground lowercase">
                  (Optional — profile data only)
                </span>
              </FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput type="email" placeholder="contact@company.com" {...field} />
                </InputGroup>
              </FormControl>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Email is never used for login, credentials recovery, or authorization.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-2.5 space-y-0">
              <FormControl>
                <Checkbox
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="flex flex-col gap-1">
                <FormLabel className="font-sans text-sm text-muted-foreground">
                  I agree to the account and Testnet demonstration policy.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {error && <p className="form-error text-center text-xs text-destructive">{error}</p>}

        <Button
          type="submit"
          variant="gradient"
          className="mt-4 h-11 w-full font-semibold"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Provision Organization Workspace
        </Button>
      </form>
    </Form>
  );
}
