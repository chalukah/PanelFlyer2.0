export type Panelist = {
  id: string;
  firstName: string;
  fullName: string;
  email: string;
  zoomJoinLink: string;
  registrationTrackingLink: string;
  promotionalMaterialsLink: string;
  questionsLink: string;
  finalBannerLink: string;
  questions: string[]; // 5 questions
  phone?: string;
  title?: string;
  bio?: string;
  registrationCount?: number; // Filled after event
  attendeeListLink?: string; // Only if 10+
  contributionSummary?: string; // For thank you email
  promoPost1Link?: string;
  promoPost2Link?: string;
  promoPost3Link?: string;
  promoPost4Link?: string;
  promoPost5Link?: string;
  promoDraft1Link?: string;
  promoDraft2Link?: string;
  promoDraft3Link?: string;
  promoDraft4Link?: string;
};

export type PanelEvent = {
  id: string;
  name: string; // e.g., "OCT 29 Panel Event"
  createdAt: string;

  // Panel Info
  panelTitle: string;
  panelSubtitle: string;
  panelPurpose: string;

  // Event Dates
  eventDate: string; // "October 29th"
  eventDateFull: string; // "Wednesday, October 29th, 2025"
  eventDateShort: string; // "29th"
  eventDateMinus1: string; // "October 28th"

  // Discussion Points
  discussionPoints: string[]; // 5 points
  briefTopicDescription: string;

  // Panelists
  panelists: Panelist[];

  // Post-Event Data
  recordingLink?: string;

  // Generated Emails
  generatedEmails: GeneratedEmail[];
};

export type EmailTemplate = {
  id: string;
  code: string; // E-22, E-20, E-13, etc.
  name: string; // "Initial Invitation", "Questions", etc.
  sender: 'RESHANI' | 'CHALUKA';
  timing: string; // "~22 days before event"
  template: string; // HTML template with [VARIABLES]
  perPanelist: boolean; // true if email is sent to each panelist separately
  requiresPostEventData: boolean; // true if needs recording, reg counts, etc.
};

export type GeneratedEmail = {
  id: string;
  templateId: string;
  panelistId?: string; // undefined if not per-panelist
  subject: string;
  htmlContent: string;
  generatedAt: string;
  missingVariables?: string[];
};

export type CSVPanelistRow = {
  'First Name': string;
  'Full Name': string;
  'Email': string;
  'Zoom Join Link': string;
  'Registration Tracking Link': string;
  'Promotional Materials Link': string;
  'Questions Link': string;
  'Final Banner Link': string;
  'Question 1': string;
  'Question 2': string;
  'Question 3': string;
  'Question 4': string;
  'Question 5': string;
  'Contact Number'?: string;
  'Current Position and Organization'?: string;
  'Short Bio'?: string;
  'Promo Post 1 Link'?: string;
  'Promo Post 2 Link'?: string;
  'Promo Post 3 Link'?: string;
  'Promo Post 4 Link'?: string;
  'Promo Post 5 Link'?: string;
  'Email Promo Draft 1 Link'?: string;
  'Email Promo Draft 2 Link'?: string;
  'Email Promo Draft 3 Link'?: string;
  'Email Promo Draft 4 Link'?: string;
};

/**
 * Event Checklist - Comprehensive task management for panel events
 * Based on "Event Management - Checklists for Panels"
 */
export type EventChecklistTask = {
  id: string;
  phase: 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Phase 5 - Post Event' | 'Phase 5 - Promotions';
  taskName: string;
  countdownDays: number;
  deadline: string;
  dateCompleted?: string;
  sampleLinks?: string;
  actualLinks?: string;
  status: 'Please Select' | 'In Progress' | 'Completed' | 'Blocked' | 'Not Applicable';
  notes?: string;
};

export type EventChecklist = {
  id: string;
  eventId?: string; // Link to PanelEvent
  eventType: string;
  eventTopic: string;
  eventPresenter: string;
  eventDate: string;
  eventTime: string;
  allocatedAE: string;
  numberOfSpeakers: number;
  teamMember: string;
  teamLead: string;
  sheetUrl?: string; // Optional Google Sheet embed URL
  tasks: EventChecklistTask[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Event Panel Tracker - Registration and conversion tracking
 * Based on "Events_ PANELS"
 */
export type PanelRegistration = {
  id: string;
  dateAdded: string;
  product: 'VET' | 'DENTAL' | 'BOA' | 'LAW' | 'TD' | 'IU' | 'RIDA' | 'DMS';
  eventName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  registrationTime: string;
  role?: string;
  practiceName?: string;
  questions?: string;
  sourceName: string; // Which panelist referred them
  country: string;
  leadType: 'Direct' | 'Partner';
  icpConfirmation: 'ICP Confirmed' | 'Non-ICP' | 'Pending Review' | '';
  attendance: boolean;
  managerVerification: boolean;
  notes?: string;

  // MSM (Marketing Strategy Meeting) tracking
  msmConversionStatus?: 'Booked' | 'Completed' | 'No Show' | 'Cancelled' | '';
  msmScore?: number;
  msmType?: 'Direct' | 'BDR' | '';
  msmsCompleted?: number;

  // Sales tracking
  ekwaSalesStatus?: 'Converted' | 'In Pipeline' | 'Lost' | '';
  csmConversionStatus?: 'Converted' | 'In Pipeline' | 'Lost' | '';
  csmType?: string;
  csmsCompleted?: number;
  coachingSalesStatus?: string;
};

export type EventPanelTracker = {
  id: string;
  eventId?: string; // Link to PanelEvent
  eventName: string;
  eventDate: string;
  product: 'VET' | 'DENTAL' | 'BOA' | 'LAW' | 'TD' | 'IU' | 'RIDA' | 'DMS';
  sheetName?: string;

  // Summary metrics
  totalRegistrations: number;
  totalIcpRegistrations: number;
  totalNonIcpRegistrations: number;
  totalAttendees: number;
  icpAttendees: number;
  nonIcpAttendees: number;

  // Registration breakdown
  directRegistrations: number;
  partnerRegistrations: number;

  // MSM metrics
  directMsmsBooked: number;
  directIcpMsmsBooked: number;
  bdrMsmsBooked: number;
  bdrIcpMsmsBooked: number;
  directMsmsCompleted: number;
  bdrMsmsCompleted: number;
  totalIcpMsmsBooked: number;
  totalIcpMsmsCompleted: number;

  // Attendee list link
  attendeeListLink?: string;

  // Timestamps
  leadListSharedWithSales?: string;
  createdAt: string;
  updatedAt: string;

  // Registration details
  registrations: PanelRegistration[];
  rawRows?: string[][];
};
