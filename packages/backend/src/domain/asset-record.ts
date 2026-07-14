import { z } from "zod";

export const ASSET_LIFECYCLE_OPTIONS = [
  "Draft",
  "Review",
  "Ready",
  "Issuing",
  "Active",
  "Failed",
  "Archived",
] as const;
export const ASSET_CATEGORY_OPTIONS = ["Real Estate", "Aviation", "Energy", "Maritime"] as const;
export const OWNERSHIP_TYPE_OPTIONS = [
  "Individual",
  "Organization",
  "Trust",
  "Joint Venture",
] as const;
export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "SGD"] as const;

// ISO 3166-1 alpha-2 codes. Labels are intentionally left to the presentation layer.
export const COUNTRY_OPTIONS =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  ) as readonly string[];

const countryCodes = new Set(COUNTRY_OPTIONS);
const collapseWhitespace = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ");
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform(collapseWhitespace)
    .optional()
    .transform((value) => value || undefined);

const estimatedValueSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a non-negative amount with at most two decimals")
  .refine((value) => value.split(".")[0]!.length <= 18, "Use at most 18 integer digits")
  .refine((value) => !/^0+(?:\.0{0,2})?$/.test(value), "Estimated value must be at least 0.01")
  .transform((value) => {
    const [integer, fraction = ""] = value.split(".");
    const normalizedInteger = integer!.replace(/^0+(?=\d)/, "");
    return `${normalizedInteger}.${fraction.padEnd(2, "0")}`;
  });

export const assetRecordSchema = z.object({
  name: z.string().transform(collapseWhitespace).pipe(z.string().min(3).max(120)),
  category: z.enum(ASSET_CATEGORY_OPTIONS),
  description: z.string().transform(collapseWhitespace).pipe(z.string().min(20).max(4000)),
  estimatedValue: estimatedValueSchema,
  currency: z.enum(CURRENCY_OPTIONS),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => countryCodes.has(value), "Use an ISO 3166-1 alpha-2 country code"),
  legalOwner: z.string().transform(collapseWhitespace).pipe(z.string().min(2).max(200)),
  registrationNumber: z.string().transform(collapseWhitespace).pipe(z.string().min(3).max(64)),
  ownershipType: z.enum(OWNERSHIP_TYPE_OPTIONS),
  contactEmail: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  address: optionalText(500),
  contactPhone: optionalText(32).pipe(
    z
      .string()
      .regex(/^\+?[\d\s()-]+$/, "Enter a valid phone number")
      .optional(),
  ),
  internalNotes: optionalText(2000),
});

export const assetUpdateSchema = assetRecordSchema.extend({
  expectedVersion: z.number().int().positive(),
});

export type AssetRecordInput = z.input<typeof assetRecordSchema>;
export type CanonicalAssetRecordInput = z.output<typeof assetRecordSchema>;
export type AssetRecordUpdate = z.input<typeof assetUpdateSchema>;
export type AssetLifecycle = (typeof ASSET_LIFECYCLE_OPTIONS)[number];
export type AssetRecord = CanonicalAssetRecordInput & {
  assetId: string;
  lifecycle: AssetLifecycle;
  createdAt: number;
  updatedAt: number;
  version: number;
};

export function normalizeAssetName(value: string): string {
  return collapseWhitespace(value).toLocaleLowerCase("en-US");
}

export function normalizeRegistrationNumber(value: string): string {
  return collapseWhitespace(value).toUpperCase().replace(/[\s-]/g, "");
}
