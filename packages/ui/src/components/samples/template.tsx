"use client";

import { Eye, EyeOff, Layers, MessageSquare, Sparkles } from "lucide-react";
import { useState } from "react";

import Loading from "../common/loading";
import { LoadingButton } from "../common/loading/loading-button";
import LoadingDots from "../common/loading/loading-dots";
import LoadingFull from "../common/loading/loading-full";
import { AdvancedDateRangePicker } from "../ui-customs/advance-range-date-picker";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { AlertDialogDemo } from "./AlertDialogSample";
import { DialogCloseButton } from "./DialogSample";
import ReactAlertSample from "./ReactAlertSample";
import { DrawerDialogDemo } from "./responsive-dialog";

export default function Template() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("sorasecret123");

  return (
    <ScrollArea className="h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 px-6 py-12">
        {/* Title */}
        <div className="mt-4 flex max-w-2xl flex-col gap-2 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">
            Next-Tailwind Starter Template
          </h1>
          <p className="text-sm text-muted-foreground">
            A comprehensive playground showcasing the Sora OS Design System and available component
            variants.
          </p>
        </div>

        {/* 1. Button Variants Showcase */}
        <Card className="w-full" variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="size-4 text-secondary" /> Button Variants
            </CardTitle>
            <CardDescription className="text-xs">
              Demonstration of all native and custom button styles.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">default</span>
              <Button variant="default">Primary</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">secondary</span>
              <Button variant="secondary">Secondary</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">outline</span>
              <Button variant="outline">Outline</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">destructive</span>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">
                gradient (Sora Primary)
              </span>
              <Button variant="gradient">Launch Platform</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">outlineSecondary</span>
              <Button variant="outlineSecondary">Secondary Action</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">ghost</span>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">link</span>
              <Button variant="link">Link Button</Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">loading</span>
              <Button variant="gradient" loading>
                Loading Button
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">disabled</span>
              <Button variant="gradient" disabled>
                Disabled Button
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Card Variants Showcase */}
        <div className="flex w-full flex-col gap-3">
          <div className="px-1">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Card Component Variants
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">default</CardTitle>
                <CardDescription className="text-xs">Standard variant</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Standard background color, flat borders.
              </CardContent>
            </Card>

            <Card variant="accented">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-secondary">accented</CardTitle>
                <CardDescription className="text-xs">Top border accent</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Includes top secondary yellow highlight border.
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">interactive</CardTitle>
                <CardDescription className="text-xs">Hover border states</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Hover to see dynamic border color changes.
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">glass</CardTitle>
                <CardDescription className="text-xs">Translucent layout</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Backdrop-blur properties for interface depth.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3. Form Input Elements */}
        <Card className="w-full" variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Layers className="size-4 text-secondary" /> Form &amp; Field Controls
            </CardTitle>
            <CardDescription className="text-xs">
              Demonstrates Input fields, checkboxes, switches, select dropdowns, and text areas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="email-demo"
                  className="font-mono text-xs text-muted-foreground uppercase"
                >
                  Email Input
                </Label>
                <Input id="email-demo" type="email" placeholder="name@soranetwork.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="pass-demo"
                  className="font-mono text-xs text-muted-foreground uppercase"
                >
                  Password Field
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="pass-demo"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Select */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="select-demo"
                  className="font-mono text-xs text-muted-foreground uppercase"
                >
                  Select Dropdown
                </Label>
                <Select>
                  <SelectTrigger id="select-demo" className="w-full">
                    <SelectValue placeholder="Choose a network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stellar">Stellar Mainnet</SelectItem>
                    <SelectItem value="testnet">Stellar Testnet</SelectItem>
                    <SelectItem value="futurenet">Stellar Futurenet</SelectItem>
                    <SelectItem value="localnet">Local Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Textarea */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="textarea-demo"
                  className="font-mono text-xs text-muted-foreground uppercase"
                >
                  Text Area
                </Label>
                <Textarea
                  id="textarea-demo"
                  placeholder="Describe your use case..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Checkbox id="check-demo" defaultChecked />
                <Label
                  htmlFor="check-demo"
                  className="cursor-pointer text-xs font-normal text-muted-foreground"
                >
                  Keep me authenticated for 30 days
                </Label>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col justify-center gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold">Biometric Auth</span>
                  <span className="text-[10px] text-muted-foreground">
                    Authenticate via Enclave
                  </span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4 opacity-55">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold">SMS Backup</span>
                  <span className="text-[10px] text-muted-foreground">
                    Disabled by administrator
                  </span>
                </div>
                <Switch disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Overlay & Dialog Components */}
        <div className="flex w-full flex-col gap-4">
          <div className="px-1">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Overlay &amp; Dialog Components
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Alert Dialog */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base font-bold">Alert Dialog</CardTitle>
                <CardDescription className="text-xs">
                  Confirmation dialogs for irreversible or important actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-[90px] items-center justify-center">
                <AlertDialogDemo />
              </CardContent>
            </Card>

            {/* Dialog */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base font-bold">Dialog</CardTitle>
                <CardDescription className="text-xs">
                  Scrollable modal dialog with fixed header and footer.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-[90px] items-center justify-center">
                <DialogCloseButton />
              </CardContent>
            </Card>

            {/* Toasts */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <MessageSquare className="size-4 text-secondary" /> Toast Notifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Sonner toast variants — default, success, warning, error, info, and loading.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-[90px] items-center justify-center">
                <ReactAlertSample />
              </CardContent>
            </Card>

            {/* Responsive Dialog */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base font-bold">Responsive Dialog</CardTitle>
                <CardDescription className="text-xs">
                  Dialog on desktop · Drawer on mobile. Content is scrollable, header/footer fixed.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-[90px] items-center justify-center">
                <DrawerDialogDemo />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 5. Original showcases styled to match */}
        <div className="flex w-full flex-col gap-4">
          <div className="px-1">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Original Template Demos
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Fonts */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base font-bold">Available Fonts</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">font-display</p>
                  <h1 className="font-display text-3xl font-bold">Hanken Grotesk</h1>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">font-sans (default)</p>
                  <p className="font-sans text-base">
                    Inter — The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">font-mono</p>
                  <code className="font-mono text-sm text-secondary">
                    const sora = &#123; network: &quot;Stellar&quot;, status: &quot;Ready&quot;
                    &#125;
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base font-bold">Badge Custom Variants</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-[100px] flex-wrap items-center justify-center gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="error">Error</Badge>
              </CardContent>
            </Card>

            {/* Date Range Picker */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base font-bold">Advanced Date Range Picker</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center rounded-lg border border-border bg-background p-6">
                <AdvancedDateRangePicker />
              </CardContent>
            </Card>

            {/* Loading Loaders */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base font-bold">Asynchronous Loaders</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <Loading />
                  <LoadingButton />
                  <LoadingDots />
                  <LoadingDots message="Please wait" dots="." />
                </div>
                <div className="rounded-lg border border-border bg-background p-6">
                  <LoadingFull className="relative py-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
