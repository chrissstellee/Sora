import { CheckCircle2, Eye, FileText } from "lucide-react";

import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { Button } from "@repo/ui/components/ui/button";

import type { ICreateAssetFormState } from "../../lib/types";
import type { ReactNode } from "react";

interface ReviewSubmitStepProps {
  form: ICreateAssetFormState;
  onEditStep: (index: number) => void;
}

function ReviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onEdit}>
          Edit
        </Button>
      </div>
      {children}
    </div>
  );
}

export function ReviewSubmitStep({ form, onEditStep }: ReviewSubmitStepProps) {
  const { basicInformation, ownershipDetails, documents } = form;

  return (
    <div className="flex flex-col gap-4">
      <ReviewCard title="Basic Info" onEdit={() => onEditStep(0)}>
        <div className="grid grid-cols-2 gap-3">
          <ReviewField label="Asset Name" value={basicInformation.assetName} />
          <ReviewField
            label="Valuation"
            value={`${basicInformation.currency} ${basicInformation.estimatedValue}`.trim()}
          />
          <ReviewField label="Asset Category" value={basicInformation.assetCategory} />
          <ReviewField label="Jurisdiction" value={basicInformation.country} />
          <ReviewField label="Physical Address" value={basicInformation.physicalAddress} />
          <ReviewField label="Asset Description" value={basicInformation.assetDescription} />
        </div>
      </ReviewCard>

      <ReviewCard title="Ownership" onEdit={() => onEditStep(1)}>
        <div className="grid grid-cols-2 gap-3">
          <ReviewField label="Legal Owner" value={ownershipDetails.legalOwner} />
          <ReviewField label="Organization Name" value={ownershipDetails.organizationName} />
          <ReviewField label="Ownership Type" value={ownershipDetails.ownershipType} />
          <ReviewField label="Registration Number" value={ownershipDetails.registrationNumber} />
          <ReviewField label="Contact Email" value={ownershipDetails.contactEmail} />
          <ReviewField label="Contact Phone" value={ownershipDetails.contactPhone} />
          <ReviewField
            label="Internal Ownership Notes"
            value={ownershipDetails.internalOwnershipNotes}
          />
        </div>
      </ReviewCard>

      <ReviewCard title="Documents" onEdit={() => onEditStep(2)}>
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.tag}</p>
              </div>
              <Eye className="size-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
      </ReviewCard>

      <Alert className="border-secondary/30 bg-secondary/10">
        <CheckCircle2 className="size-4 text-secondary" />
        <AlertDescription className="text-xs text-foreground">
          Ready for deployment? Your asset configuration is validated and ready for the SORA
          network.
        </AlertDescription>
      </Alert>
    </div>
  );
}
