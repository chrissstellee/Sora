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

import { useLogin } from "../../hooks/use-login";
import { loginSchema, type LoginValues } from "../../lib/schema";

const labelClass = "text-xs font-medium tracking-widest text-muted-foreground uppercase";

export function LoginForm() {
  const { login, isSubmitting, serverError } = useLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(login)} className="flex flex-col gap-6" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Email Address</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput type="email" placeholder="name@company.com" {...field} />
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
              <FormLabel className={labelClass}>Password</FormLabel>
              <FormControl>
                <InputPassword placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-sans text-sm text-muted-foreground">
                  Remember Me
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {serverError && <p className="form-error text-center">{serverError}</p>}

        <Button
          type="submit"
          variant="gradient"
          className="mt-4 w-full font-semibold"
          loading={isSubmitting}
        >
          Sign In
        </Button>
      </form>
    </Form>
  );
}
