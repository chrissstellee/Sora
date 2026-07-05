"use client";

import { ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

export function AlertDialogDemo() {
  const [openDestructive, setOpenDestructive] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      {/* Destructive */}
      <AlertDialog open={openDestructive} onOpenChange={setOpenDestructive}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete Account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash2 className="size-8 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data will be permanently
              removed from our servers and you will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => console.log("Account deleted")}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Confirm Action</Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-secondary/10">
              <ShieldAlert className="size-8 text-secondary" />
            </AlertDialogMedia>
            <AlertDialogTitle>Confirm this action?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to proceed? This will apply the changes
              immediately to your current session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="gradient"
              onClick={() => console.log("Confirmed")}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
