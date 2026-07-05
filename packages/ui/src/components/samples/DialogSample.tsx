"use client";

import { Copy, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

export function DialogCloseButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="mr-2 size-4" />
          Share Link
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-md">
        {/* Header — fixed */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Scrollable content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="link-demo"
                className="font-mono text-xs text-muted-foreground uppercase"
              >
                Shareable URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="link-demo"
                  defaultValue="https://app.soranetwork.com/share/xyz-token"
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={copied ? "gradient" : "outline"}
                  className="shrink-0 px-3 transition-all"
                  onClick={handleCopy}
                >
                  <Copy className="size-4" />
                  <span className="sr-only">Copy</span>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                This link will expire in{" "}
                <span className="font-semibold text-foreground">7 days</span>. You can revoke access
                at any time from your account settings.
              </p>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer — fixed */}
        <DialogFooter className="px-6 py-4" showCloseButton>
          <Button variant="gradient" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
