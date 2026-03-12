import type { EmailTemplate } from '../types';

// Email templates — stored as placeholder strings for production builds.
// In local dev, these are loaded from ../../PANEL EMAIL TEMPLATES/ via Vite ?raw imports.
// For deployed builds (Vercel), templates show as empty — the flyer generator doesn't need them.
const templateE22 = '';
const templateE13 = '';
const templateCalendarInvite = '';
const templateE20 = '';
const templateE10Promo = '';
const templateE10Questions = '';
const templateE6 = '';
const templateE5 = '';
const templateE4 = '';
const templateE2 = '';
const templateE1 = '';
const templateEDayTwoHours = '';
const templateEDayNow = '';
const templateEPlus1 = '';
const templatePostLead = '';
const templatePostPanelists = '';
const templatePostRegistrants = '';
const templateRandomReminder = '';

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: '01-e22-initial',
    code: 'E-22',
    name: 'Initial Invitation',
    sender: 'RESHANI',
    timing: '~22 days before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE22,
  },
  {
    id: '02-e20-followup',
    code: 'E-20',
    name: 'Follow-up Reminder',
    sender: 'RESHANI',
    timing: '~20 days before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE20,
  },
  {
    id: '03-e13-confirmation',
    code: 'E-13',
    name: 'Confirmation Thank You',
    sender: 'RESHANI',
    timing: 'Immediately after panelist confirms',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE13,
  },
  {
    id: '03.5-calendar-invite',
    code: 'CALENDAR',
    name: 'Calendar Invite',
    sender: 'CHALUKA',
    timing: 'After confirmation',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateCalendarInvite,
  },
  {
    id: '04-e10-promo',
    code: 'E-10',
    name: 'Promotional Materials',
    sender: 'CHALUKA',
    timing: '~10 days before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE10Promo,
  },
  {
    id: '05-e10-questions',
    code: 'E-10',
    name: 'Question Draft',
    sender: 'CHALUKA',
    timing: '~10 days before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE10Questions,
  },
  {
    id: '06-e6-boost',
    code: 'E-6',
    name: 'Boost Registrations',
    sender: 'CHALUKA',
    timing: '~6 days before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE6,
  },
  {
    id: '07-e5-help',
    code: 'E-5',
    name: 'Help Reach More',
    sender: 'CHALUKA',
    timing: '~5 days before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE5,
  },
  {
    id: '08-e4-reminder',
    code: 'E-4',
    name: '3 Days Reminder',
    sender: 'CHALUKA',
    timing: '3 days before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE4,
  },
  {
    id: '09-e2-tomorrow',
    code: 'E-2',
    name: 'Tomorrow Panel',
    sender: 'CHALUKA',
    timing: '1 day before event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE2,
  },
  {
    id: '10-e1-today',
    code: 'E-1',
    name: 'Today is the Day',
    sender: 'CHALUKA',
    timing: 'Event day morning',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateE1,
  },
  {
    id: '11-eday-two-hours',
    code: 'E-DAY',
    name: 'Starting in 2 Hours',
    sender: 'CHALUKA',
    timing: '2 hours before event (6:00 PM EST)',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateEDayTwoHours,
  },
  {
    id: '12-eday-starting-now',
    code: 'E-DAY',
    name: 'Starting Now',
    sender: 'CHALUKA',
    timing: '15 minutes before event (7:45 PM EST)',
    perPanelist: true,
    requiresPostEventData: false,
    template: templateEDayNow,
  },
  {
    id: '13-eplus1-thank-you',
    code: 'E+1',
    name: 'Thank You + Recording',
    sender: 'CHALUKA',
    timing: 'Day after event',
    perPanelist: true,
    requiresPostEventData: true,
    template: templateEPlus1,
  },
  {
    id: '14-post-lead-report',
    code: 'POST',
    name: 'Lead Report to Karen',
    sender: 'CHALUKA',
    timing: 'Day after event',
    perPanelist: false,
    requiresPostEventData: true,
    template: templatePostLead,
  },
  {
    id: '15-post-panelists',
    code: 'POST',
    name: 'Thank You to Panelists',
    sender: 'CHALUKA',
    timing: 'Day after event',
    perPanelist: true,
    requiresPostEventData: false,
    template: templatePostPanelists,
  },
  {
    id: '16-post-registrants',
    code: 'POST',
    name: 'Thank You to Registrants',
    sender: 'CHALUKA',
    timing: 'Day after event',
    perPanelist: false,
    requiresPostEventData: true,
    template: templatePostRegistrants,
  },
  {
    id: '17-random-reminder',
    code: 'REMINDER',
    name: 'Random Registration Reminder',
    sender: 'CHALUKA',
    timing: 'As needed',
    perPanelist: false,
    requiresPostEventData: false,
    template: templateRandomReminder,
  },
];
