"use client";

import * as React from "react";

import { useMediaQuery } from "../../hooks/use-media-query";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

/* ─────────────────────────────────────────────────────────────
   Context
───────────────────────────────────────────────────────────── */

interface CredenzaContextValue {
  isDesktop: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CredenzaContext = React.createContext<CredenzaContextValue | null>(null);

function useCredenza() {
  const ctx = React.useContext(CredenzaContext);
  if (!ctx) throw new Error("useCredenza must be used within <Credenza />");
  return ctx;
}

/* ─────────────────────────────────────────────────────────────
   Root
───────────────────────────────────────────────────────────── */

interface CredenzaProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Breakpoint at which the Dialog is shown instead of the Drawer.
   *  Defaults to `"(min-width: 768px)"`. */
  breakpoint?: string;
}

function Credenza({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  breakpoint = "(min-width: 768px)",
}: CredenzaProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isDesktop = useMediaQuery(breakpoint);

  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  const Root = isDesktop ? Dialog : Drawer;

  return (
    <CredenzaContext.Provider value={{ isDesktop, open, onOpenChange }}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </CredenzaContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────
   Trigger
───────────────────────────────────────────────────────────── */

function CredenzaTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const { isDesktop } = useCredenza();
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger;
  return <Trigger {...props}>{children}</Trigger>;
}

/* ─────────────────────────────────────────────────────────────
   Close
───────────────────────────────────────────────────────────── */

function CredenzaClose({ children, ...props }: React.ComponentProps<typeof DialogClose>) {
  const { isDesktop } = useCredenza();
  const Close = isDesktop ? DialogClose : DrawerClose;
  return <Close {...props}>{children}</Close>;
}

/* ─────────────────────────────────────────────────────────────
   Content
   - Dialog: flex column, max-h constrained, no internal padding
   - Drawer:  same flex column approach, bottom sheet
───────────────────────────────────────────────────────────── */

interface CredenzaContentProps {
  children: React.ReactNode;
  className?: string;
  /** Max height of the panel. Defaults to `"85vh"`. */
  maxHeight?: string;
  /** Max width of the Dialog panel. Defaults to `"480px"`. */
  maxWidth?: string;
}

function CredenzaContent({
  children,
  className,
  maxHeight = "85vh",
  maxWidth = "480px",
}: CredenzaContentProps) {
  const { isDesktop } = useCredenza();

  if (isDesktop) {
    return (
      <DialogContent
        className={cn("flex flex-col gap-0 p-0", className)}
        style={{
          maxHeight,
          maxWidth: `min(calc(100vw - 2rem), ${maxWidth})`,
        }}
      >
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={cn("flex flex-col", className)} style={{ maxHeight }}>
      {/* vaul drag handle is rendered inside DrawerContent automatically */}
      {children}
    </DrawerContent>
  );
}

/* ─────────────────────────────────────────────────────────────
   Header  (fixed — sits above the scrollable body)
───────────────────────────────────────────────────────────── */

function CredenzaHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { isDesktop } = useCredenza();
  const Header = isDesktop ? DialogHeader : DrawerHeader;
  return (
    <>
      <Header className={cn("px-6 pt-6 pb-4", !isDesktop && "text-left", className)} {...props} />
      <Separator />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Body  (the scrollable region)
───────────────────────────────────────────────────────────── */

function CredenzaBody({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <ScrollArea className="flex-1 overflow-y-auto">
      <div className={cn("px-6 py-4", className)} {...props}>
        {children}
      </div>
    </ScrollArea>
  );
}

/* ─────────────────────────────────────────────────────────────
   Footer  (fixed — sits below the scrollable body)
───────────────────────────────────────────────────────────── */

function CredenzaFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { isDesktop } = useCredenza();
  const Footer = isDesktop ? DialogFooter : DrawerFooter;
  return (
    <>
      <Separator />
      <Footer className={cn("px-6 py-4", className)} {...props} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Title
───────────────────────────────────────────────────────────── */

function CredenzaTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  const { isDesktop } = useCredenza();
  const Title = isDesktop ? DialogTitle : DrawerTitle;
  return <Title className={cn(className)} {...props} />;
}

/* ─────────────────────────────────────────────────────────────
   Description
───────────────────────────────────────────────────────────── */

function CredenzaDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const { isDesktop } = useCredenza();
  const Description = isDesktop ? DialogDescription : DrawerDescription;
  return <Description className={cn(className)} {...props} />;
}

/* ─────────────────────────────────────────────────────────────
   Exports
───────────────────────────────────────────────────────────── */

export {
  Credenza,
  CredenzaTrigger,
  CredenzaClose,
  CredenzaContent,
  CredenzaHeader,
  CredenzaBody,
  CredenzaFooter,
  CredenzaTitle,
  CredenzaDescription,
};
