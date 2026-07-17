"use client";

import { LayoutTemplate, Save, User } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "../ui-customs/credenza";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

export function DrawerDialogDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant="outline">
          <LayoutTemplate className="mr-2 size-4" />
          Edit Profile
        </Button>
      </CredenzaTrigger>

      <CredenzaContent maxWidth="480px">
        <CredenzaHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
              <User className="size-4 text-secondary" />
            </div>
            <div>
              <CredenzaTitle>Edit profile</CredenzaTitle>
              <CredenzaDescription className="mt-0.5 text-xs">
                Make changes to your profile here. Click save when you&apos;re done.
              </CredenzaDescription>
            </div>
          </div>
        </CredenzaHeader>

        <CredenzaBody>
          <ProfileForm id="profile-form" />
        </CredenzaBody>

        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button variant="ghost">Cancel</Button>
          </CredenzaClose>
          <Button variant="gradient" type="submit" form="profile-form">
            <Save className="mr-2 size-4" />
            Save changes
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}

function ProfileForm({ className, id }: React.ComponentProps<"form">) {
  return (
    <form id={id} className={cn("flex flex-col gap-4 font-sans", className)}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first-name" className="font-mono text-xs text-muted-foreground uppercase">
            First Name
          </Label>
          <Input id="first-name" placeholder="John" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last-name" className="font-mono text-xs text-muted-foreground uppercase">
            Last Name
          </Label>
          <Input id="last-name" placeholder="Doe" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="profile-email"
          className="font-mono text-xs text-muted-foreground uppercase"
        >
          Email
        </Label>
        <Input type="email" id="profile-email" placeholder="user@soranetwork.com" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-role" className="font-mono text-xs text-muted-foreground uppercase">
          Role
        </Label>
        <Select>
          <SelectTrigger id="profile-role" className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="analyst">Analyst</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-bio" className="font-mono text-xs text-muted-foreground uppercase">
          Bio
        </Label>
        <Textarea
          id="profile-bio"
          placeholder="Tell us a little about yourself..."
          className="min-h-24 resize-none"
        />
      </div>
    </form>
  );
}
