"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { InputPassword } from "@repo/ui/components/ui/input-password";

import { useRegister } from "../../hooks/use-register";
import { registerSchema, type RegisterValues } from "../../lib/schema";
import { PasswordStrengthMeter } from "./password-strength-meter";

const labelClass = "text-xs font-medium tracking-widest text-muted-foreground uppercase";

export function RegisterForm() {
  const { register, isSubmitting, serverError } = useRegister();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      organization: "",
      email: "",
      password: "",
      agreeToTerms: false,
    },
  });

  const password = form.watch("password");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(register)} className="flex flex-col gap-6" noValidate>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Full Name</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput placeholder="John Doe" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Organization</FormLabel>
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
              <FormLabel className={labelClass}>Corporate Email</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput type="email" placeholder="john@sora.enterprise" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Secure Password</FormLabel>
              <FormControl>
                <InputPassword placeholder="••••••••••••" {...field} />
              </FormControl>
              <PasswordStrengthMeter password={password} />
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

        {serverError && <p className="form-error text-center">{serverError}</p>}

        <Button
          type="submit"
          variant="gradient"
          className="mt-4 w-full font-semibold"
          loading={isSubmitting}
        >
          Create Sora Account
        </Button>
      </form>
    </Form>
  );
}
