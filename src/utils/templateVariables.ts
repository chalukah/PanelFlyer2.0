/**
 * Central catalog of all template variables used in banner and email templates.
 * Used for Monaco Editor autocomplete and documentation.
 */

export type TemplateVariable = {
  name: string;
  description: string;
  example: string;
  category: 'event' | 'panelist' | 'banner' | 'email';
};

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Event variables
  { name: '[PANEL_TITLE]', description: 'Main panel title', example: 'Veterinary Ownership & Leadership Panel', category: 'event' },
  { name: '[PANEL_SUBTITLE]', description: 'Panel subtitle/tagline', example: 'Leading Through Change: Practical Leadership', category: 'event' },
  { name: '[PANEL_TOPIC]', description: 'Panel discussion topic', example: 'Leading Through Change', category: 'event' },
  { name: '[EVENT_DATE]', description: 'Full event date', example: 'Wednesday, January 15th, 2025', category: 'event' },
  { name: '[EVENT_DATE_SHORT]', description: 'Short date', example: '15th', category: 'event' },
  { name: '[EVENT_DATE_FULL]', description: 'Full formatted date', example: 'WEDNESDAY, JANUARY 15, 2025', category: 'event' },
  { name: '[EVENT_DATE_MINUS1]', description: 'Day before event', example: 'January 14th', category: 'event' },
  { name: '[EVENT_TIME]', description: 'Event time with timezone', example: '8:00 PM – 9:00 PM EST', category: 'event' },
  { name: '[ZOOM_REGISTRATION_URL]', description: 'Zoom registration link', example: 'https://zoom.us/webinar/register/...', category: 'event' },
  { name: '[WEBSITE_URL]', description: 'Website URL', example: 'www.example.com', category: 'event' },
  { name: '[HEADER_TEXT]', description: 'Banner header text', example: 'Veterinary Business Institute Expert Panel', category: 'event' },
  { name: '[RECORDING_LINK]', description: 'Post-event recording URL', example: 'https://zoom.us/rec/...', category: 'event' },

  // Panelist variables (repeat for 1-4)
  ...([1, 2, 3, 4] as const).flatMap(n => [
    { name: `[PANELIST_${n}_NAME]`, description: `Panelist ${n} full name`, example: 'Dr. Jane Smith, DVM', category: 'panelist' as const },
    { name: `[PANELIST_${n}_FIRST_NAME]`, description: `Panelist ${n} first name`, example: 'Jane', category: 'panelist' as const },
    { name: `[PANELIST_${n}_TITLE]`, description: `Panelist ${n} job title`, example: 'Founder & CEO', category: 'panelist' as const },
    { name: `[PANELIST_${n}_ORG]`, description: `Panelist ${n} organization`, example: 'Smith Animal Hospital', category: 'panelist' as const },
    { name: `[PANELIST_${n}_HEADSHOT]`, description: `Panelist ${n} headshot image URL`, example: 'data:image/png;base64,...', category: 'panelist' as const },
  ]),

  // Per-panelist email variables
  { name: '[PANELIST_FIRST_NAME]', description: 'Current panelist first name (email)', example: 'Jane', category: 'email' },
  { name: '[PANELIST_FULL_NAME]', description: 'Current panelist full name (email)', example: 'Dr. Jane Smith', category: 'email' },
  { name: '[PANELIST_EMAIL]', description: 'Current panelist email', example: 'jane@example.com', category: 'email' },
  { name: '[PANELIST_REGISTRATION_COUNT]', description: 'Registrations from this panelist', example: '24', category: 'email' },
  { name: '[PANELIST_ATTENDEE_LIST_LINK]', description: 'Attendee list link (if 10+)', example: 'https://drive.google.com/...', category: 'email' },
  { name: '[PANELIST_CONTRIBUTION_SUMMARY]', description: 'Post-event contribution summary', example: 'Brought 24 registrations, 15 attended.', category: 'email' },

  // Banner-specific
  { name: '[QR_CODE_B1]', description: 'QR code image for B1 banner', example: 'data:image/png;base64,...', category: 'banner' },
  { name: '[QR_CODE_B2]', description: 'QR code image for B2 banner', example: 'data:image/png;base64,...', category: 'banner' },
  { name: '[QR_CODE_B3]', description: 'QR code image for B3 banner', example: 'data:image/png;base64,...', category: 'banner' },
  { name: '[QR_CODE_B4]', description: 'QR code image for B4 banner', example: 'data:image/png;base64,...', category: 'banner' },
  { name: '[QR_CODE_B5]', description: 'QR code image for B5 banner', example: 'data:image/png;base64,...', category: 'banner' },
];

/** Get all variable names as strings (for Monaco autocomplete) */
export function getVariableNames(): string[] {
  return TEMPLATE_VARIABLES.map(v => v.name);
}

/** Get variables filtered by category */
export function getVariablesByCategory(category: TemplateVariable['category']): TemplateVariable[] {
  return TEMPLATE_VARIABLES.filter(v => v.category === category);
}

/** Generate sample data for template preview */
export function getSampleData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (const v of TEMPLATE_VARIABLES) {
    data[v.name] = v.example;
  }
  return data;
}

/** Replace all template variables in HTML with sample data */
export function replaceWithSampleData(html: string): string {
  const samples = getSampleData();
  let result = html;
  for (const [key, value] of Object.entries(samples)) {
    result = result.replaceAll(key, value);
  }
  return result;
}
