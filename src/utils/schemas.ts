import { z } from 'zod';

// ——————————————————————————————————————
// Panelist Schemas
// ——————————————————————————————————————

export const ParsedPanelistSchema = z.object({
  name: z.string().default(''),
  firstName: z.string().default(''),
  title: z.string().default(''),
  org: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  headshotMatch: z.string().optional(),
  headshotUrl: z.string().optional(),
});

export type ValidatedParsedPanelist = z.infer<typeof ParsedPanelistSchema>;

// ——————————————————————————————————————
// AI Extraction Result (from /api/gog/extract)
// ——————————————————————————————————————

export const GogExtractResultSchema = z.object({
  panelName: z.string().default(''),
  panelTopic: z.string().default(''),
  panelSubtitle: z.string().default(''),
  eventDate: z.string().default(''),
  eventTime: z.string().default(''),
  websiteUrl: z.string().default(''),
  zoomRegistrationUrl: z.string().default(''),
  headerText: z.string().default(''),
  panelists: z.array(ParsedPanelistSchema).default([]),
});

export type ValidatedGogExtractResult = z.infer<typeof GogExtractResultSchema>;

// ——————————————————————————————————————
// PanelEvent Schema (for import validation)
// ——————————————————————————————————————

export const PanelistSchema = z.object({
  id: z.string(),
  firstName: z.string().default(''),
  fullName: z.string().default(''),
  email: z.string().default(''),
  zoomJoinLink: z.string().default(''),
  registrationTrackingLink: z.string().default(''),
  promotionalMaterialsLink: z.string().default(''),
  questionsLink: z.string().default(''),
  finalBannerLink: z.string().default(''),
  questions: z.array(z.string()).default([]),
  phone: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  registrationCount: z.number().optional(),
  attendeeListLink: z.string().optional(),
  contributionSummary: z.string().optional(),
  promoPost1Link: z.string().optional(),
  promoPost2Link: z.string().optional(),
  promoPost3Link: z.string().optional(),
  promoPost4Link: z.string().optional(),
  promoPost5Link: z.string().optional(),
  promoDraft1Link: z.string().optional(),
  promoDraft2Link: z.string().optional(),
  promoDraft3Link: z.string().optional(),
  promoDraft4Link: z.string().optional(),
});

export const GeneratedEmailSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  panelistId: z.string().optional(),
  subject: z.string(),
  htmlContent: z.string(),
  generatedAt: z.string(),
  missingVariables: z.array(z.string()).optional(),
});

export const PanelEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  panelTitle: z.string().default(''),
  panelSubtitle: z.string().default(''),
  panelPurpose: z.string().default(''),
  eventDate: z.string().default(''),
  eventDateFull: z.string().default(''),
  eventDateShort: z.string().default(''),
  eventDateMinus1: z.string().default(''),
  discussionPoints: z.array(z.string()).default([]),
  briefTopicDescription: z.string().default(''),
  panelists: z.array(PanelistSchema).default([]),
  recordingLink: z.string().optional(),
  generatedEmails: z.array(GeneratedEmailSchema).default([]),
});

// ——————————————————————————————————————
// CSV Import Row Schema
// ——————————————————————————————————————

export const CSVPanelistRowSchema = z.object({
  'First Name': z.string().default(''),
  'Full Name': z.string().default(''),
  'Email': z.string().default(''),
  'Zoom Join Link': z.string().default(''),
  'Registration Tracking Link': z.string().default(''),
  'Promotional Materials Link': z.string().default(''),
  'Questions Link': z.string().default(''),
  'Final Banner Link': z.string().default(''),
  'Question 1': z.string().default(''),
  'Question 2': z.string().default(''),
  'Question 3': z.string().default(''),
  'Question 4': z.string().default(''),
  'Question 5': z.string().default(''),
  'Contact Number': z.string().optional(),
  'Current Position and Organization': z.string().optional(),
  'Short Bio': z.string().optional(),
});

// ——————————————————————————————————————
// Custom Banner Template Schema
// ——————————————————————————————————————

export const CustomBannerTemplateSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string(),
  htmlTemplate: z.string(),
  variables: z.array(z.string()).default([]),
  clonedFrom: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CustomBannerTemplate = z.infer<typeof CustomBannerTemplateSchema>;

// ——————————————————————————————————————
// User Profile Schema
// ——————————————————————————————————————

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  anthropicApiKey: z.string().optional(),
  displayName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ——————————————————————————————————————
// Validation Helpers
// ——————————————————————————————————————

export function validateExtraction(data: unknown): {
  success: boolean;
  data?: ValidatedGogExtractResult;
  warnings: string[];
} {
  const warnings: string[] = [];
  const result = GogExtractResultSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      warnings: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    };
  }

  const validated = result.data;

  // Check for common data quality issues
  if (!validated.panelTopic) warnings.push('No panel topic extracted');
  if (validated.panelists.length === 0) warnings.push('No panelists found');

  for (const [i, p] of validated.panelists.entries()) {
    if (!p.name) warnings.push(`Panelist ${i + 1}: missing name`);
    if (!p.title) warnings.push(`Panelist ${i + 1} (${p.name || 'unknown'}): missing title`);
    if (!p.org) warnings.push(`Panelist ${i + 1} (${p.name || 'unknown'}): missing organization`);
  }

  return { success: true, data: validated, warnings };
}

export function validatePanelEventImport(data: unknown): {
  success: boolean;
  data?: z.infer<typeof PanelEventSchema>;
  errors: string[];
} {
  const result = PanelEventSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    };
  }
  return { success: true, data: result.data, errors: [] };
}
