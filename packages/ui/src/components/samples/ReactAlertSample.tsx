"use client";

import { AlertCircle, BellRing, CheckCircle2, Info, Loader2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";

type ToastVariant = {
  label: string;
  icon: React.ReactNode;
  variant:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "gradient"
    | "outlineSecondary"
    | "destructive";
  action: () => void;
};

const toastItems: ToastVariant[] = [
  {
    label: "Default",
    icon: <BellRing className="size-3.5" />,
    variant: "default",
    action: () =>
      toast("Event has been created", {
        description: "Sunday, December 03, 2023 at 9:00 AM",
      }),
  },
  {
    label: "Success",
    icon: <CheckCircle2 className="size-3.5" />,
    variant: "gradient",
    action: () =>
      toast.success("Changes saved successfully", {
        duration: 5000,
        description: "Your profile has been updated.",
        action: { label: "Undo", onClick: () => console.log("Undo") },
      }),
  },
  {
    label: "Warning",
    icon: <TriangleAlert className="size-3.5" />,
    variant: "outlineSecondary",
    action: () =>
      toast.warning("Storage limit approaching", {
        duration: 5000,
        description: "You have used 85% of your storage quota.",
        action: { label: "Upgrade", onClick: () => console.log("Upgrade") },
      }),
  },
  {
    label: "Error",
    icon: <AlertCircle className="size-3.5" />,
    variant: "destructive",
    action: () =>
      toast.error("Connection failed", {
        duration: 5000,
        description: "Unable to reach the server. Please try again.",
        action: { label: "Retry", onClick: () => console.log("Retry") },
      }),
  },
  {
    label: "Info",
    icon: <Info className="size-3.5" />,
    variant: "outline",
    action: () =>
      toast.info("New update available", {
        duration: 5000,
        description: "Version 2.4.0 is ready to install.",
        action: { label: "Install", onClick: () => console.log("Install") },
      }),
  },
  {
    label: "Loading",
    icon: <Loader2 className="size-3.5 animate-spin" />,
    variant: "secondary",
    action: () => {
      const id = toast.loading("Processing your request...", {
        duration: 900000,
        description: "This may take a few seconds.",
      });
      setTimeout(() => {
        toast.dismiss(id);
        toast.success("Request completed!", {
          description: "All changes have been applied.",
          action: { label: "View", onClick: () => console.log("View") },
        });
      }, 3000);
    },
  },
  {
    label: "Dismiss All",
    icon: <X className="size-3.5" />,
    variant: "ghost",
    action: () => toast.dismiss(),
  },
];

export default function ReactAlertSample() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {toastItems.map((item) => (
        <Button
          key={item.label}
          variant={item.variant}
          size="sm"
          onClick={item.action}
          className="gap-1.5"
        >
          {item.icon}
          {item.label}
        </Button>
      ))}
    </div>
  );
}
