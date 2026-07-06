import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";

import { OWNERSHIP_TYPE_OPTIONS } from "../../constants/ownership-type-options";

import type { IOwnershipDetails } from "../../lib/types";

interface OwnershipDetailsStepProps {
  value: IOwnershipDetails;
  onChange: (patch: Partial<IOwnershipDetails>) => void;
}

export function OwnershipDetailsStep({ value, onChange }: OwnershipDetailsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="legalOwner">Legal Owner</Label>
        <Input
          id="legalOwner"
          value={value.legalOwner}
          onChange={(e) => onChange({ legalOwner: e.target.value })}
          placeholder="Juan Dela Cruz"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="organizationName">Organization Name</Label>
        <Input
          id="organizationName"
          value={value.organizationName}
          onChange={(e) => onChange({ organizationName: e.target.value })}
          placeholder="Acme Real Estate Holdings"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ownershipType">Ownership Type</Label>
          <Select value={value.ownershipType} onValueChange={(v) => onChange({ ownershipType: v })}>
            <SelectTrigger id="ownershipType" className="w-full">
              <SelectValue placeholder="e.g. Organization" />
            </SelectTrigger>
            <SelectContent>
              {OWNERSHIP_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            value={value.registrationNumber}
            onChange={(e) => onChange({ registrationNumber: e.target.value })}
            placeholder="Tax ID / Company Reg No"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={value.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            placeholder="name@org.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            type="tel"
            value={value.contactPhone}
            onChange={(e) => onChange({ contactPhone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="internalOwnershipNotes">Internal Ownership Notes</Label>
        <Textarea
          id="internalOwnershipNotes"
          value={value.internalOwnershipNotes}
          onChange={(e) => onChange({ internalOwnershipNotes: e.target.value })}
          placeholder="Describe complex ownership structures, beneficiary details, or internal references..."
          rows={4}
        />
      </div>
    </div>
  );
}
