/**
 * Supabase Sync Layer — bridges Zustand store with Supabase PostgreSQL.
 *
 * Design:
 * - Zustand remains the UI source of truth (optimistic updates).
 * - After each CRUD, we sync to Supabase in the background.
 * - On login, we load from Supabase and merge with any localStorage data.
 * - On failure, we queue retries and show toasts.
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import { withRetry } from '../utils/retry';
import type { PanelEvent, EventChecklist, EventPanelTracker } from '../types';
import type { CustomBannerTemplate, UserProfile } from '../utils/schemas';

// ——————————————————————————————————————
// Auth helpers
// ——————————————————————————————————————

export async function getCurrentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

// ——————————————————————————————————————
// Profile
// ——————————————————————————————————————

export async function loadProfile(): Promise<UserProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    anthropicApiKey: data.anthropic_api_key || '',
    displayName: data.display_name || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function saveApiKey(apiKey: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    localStorage.setItem('panel_flyer_claude_key', apiKey);
    return;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    localStorage.setItem('panel_flyer_claude_key', apiKey);
    return;
  }

  await withRetry(async () => {
    const { error } = await sb.from('profiles').update({ anthropic_api_key: apiKey, updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) throw error;
  });
}

export async function getApiKey(): Promise<string> {
  const sb = getSupabase();
  if (sb) {
    const profile = await loadProfile();
    if (profile?.anthropicApiKey) return profile.anthropicApiKey;
  }
  return localStorage.getItem('panel_flyer_claude_key') || '';
}

// ——————————————————————————————————————
// Panel Events
// ——————————————————————————————————————

export async function loadEvents(): Promise<PanelEvent[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await withRetry(async () => {
    return await sb.from('panel_events').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  });

  if (error || !data) return [];
  return (data as any[]).map(dbEventToLocal);
}

export async function upsertEvent(event: PanelEvent): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  await withRetry(async () => {
    const { error } = await sb.from('panel_events').upsert(localEventToDb(event, userId));
    if (error) throw error;
  });
}

export async function deleteEventRemote(eventId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  await withRetry(async () => {
    const { error } = await sb.from('panel_events').delete().eq('id', eventId).eq('user_id', userId);
    if (error) throw error;
  });
}

// ——————————————————————————————————————
// Event Checklists
// ——————————————————————————————————————

export async function loadChecklists(): Promise<EventChecklist[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await withRetry(async () => {
    return await sb.from('event_checklists').select('*').eq('user_id', userId);
  });

  if (error || !data) return [];
  return (data as any[]).map(dbChecklistToLocal);
}

export async function upsertChecklist(checklist: EventChecklist): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  await withRetry(async () => {
    const { error } = await sb.from('event_checklists').upsert(localChecklistToDb(checklist, userId));
    if (error) throw error;
  });
}

// ——————————————————————————————————————
// Event Panel Trackers
// ——————————————————————————————————————

export async function loadTrackers(): Promise<EventPanelTracker[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await withRetry(async () => {
    return await sb.from('event_panel_trackers').select('*').eq('user_id', userId);
  });

  if (error || !data) return [];
  return (data as any[]).map(dbTrackerToLocal);
}

export async function upsertTracker(tracker: EventPanelTracker): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  await withRetry(async () => {
    const { error } = await sb.from('event_panel_trackers').upsert(localTrackerToDb(tracker, userId));
    if (error) throw error;
  });
}

// ——————————————————————————————————————
// Custom Banner Templates
// ——————————————————————————————————————

export async function loadCustomTemplates(): Promise<CustomBannerTemplate[]> {
  const sb = getSupabase();
  if (!sb) {
    try {
      return JSON.parse(localStorage.getItem('panel_custom_templates') || '[]');
    } catch { return []; }
  }
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await withRetry(async () => {
    return await sb.from('custom_banner_templates').select('*').eq('user_id', userId);
  });

  if (error || !data) return [];
  return (data as any[]).map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    name: d.name,
    htmlTemplate: d.html_template,
    variables: d.variables || [],
    clonedFrom: d.cloned_from,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

export async function upsertCustomTemplate(template: CustomBannerTemplate): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    const templates = await loadCustomTemplates();
    const idx = templates.findIndex(t => t.id === template.id);
    if (idx >= 0) templates[idx] = template;
    else templates.push(template);
    localStorage.setItem('panel_custom_templates', JSON.stringify(templates));
    return;
  }
  const userId = await getCurrentUserId();
  if (!userId) return;

  await withRetry(async () => {
    const { error } = await sb.from('custom_banner_templates').upsert({
      id: template.id,
      user_id: userId,
      name: template.name,
      html_template: template.htmlTemplate,
      variables: template.variables,
      cloned_from: template.clonedFrom,
      created_at: template.createdAt,
      updated_at: template.updatedAt,
    });
    if (error) throw error;
  });
}

export async function deleteCustomTemplate(templateId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    const templates = await loadCustomTemplates();
    localStorage.setItem('panel_custom_templates', JSON.stringify(templates.filter(t => t.id !== templateId)));
    return;
  }
  const userId = await getCurrentUserId();
  if (!userId) return;

  await withRetry(async () => {
    const { error } = await sb.from('custom_banner_templates').delete().eq('id', templateId).eq('user_id', userId);
    if (error) throw error;
  });
}

// ——————————————————————————————————————
// Migration: push localStorage data to Supabase on first login
// ——————————————————————————————————————

export async function migrateLocalDataToSupabase(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  let migrated = 0;

  try {
    const raw = localStorage.getItem('vbi-panel-store');
    if (!raw) return 0;
    const local = JSON.parse(raw);
    const state = local.state || local;

    if (Array.isArray(state.panelEvents)) {
      for (const event of state.panelEvents) {
        await upsertEvent(event);
        migrated++;
      }
    }

    if (Array.isArray(state.eventChecklists)) {
      for (const cl of state.eventChecklists) {
        await upsertChecklist(cl);
        migrated++;
      }
    }

    if (Array.isArray(state.eventPanelTrackers)) {
      for (const tr of state.eventPanelTrackers) {
        await upsertTracker(tr);
        migrated++;
      }
    }

    const apiKey = localStorage.getItem('panel_flyer_claude_key');
    if (apiKey) {
      await saveApiKey(apiKey);
      migrated++;
    }
  } catch (err) {
    console.error('[migration] Failed to migrate localStorage to Supabase:', err);
  }

  return migrated;
}

// ——————————————————————————————————————
// DB ↔ Local conversion helpers
// ——————————————————————————————————————

function localEventToDb(event: PanelEvent, userId: string) {
  return {
    id: event.id,
    user_id: userId,
    name: event.name,
    panel_title: event.panelTitle,
    panel_subtitle: event.panelSubtitle,
    panel_purpose: event.panelPurpose,
    event_date: event.eventDate,
    event_date_full: event.eventDateFull,
    event_date_short: event.eventDateShort,
    event_date_minus1: event.eventDateMinus1,
    discussion_points: event.discussionPoints,
    brief_topic_description: event.briefTopicDescription,
    panelists: event.panelists,
    recording_link: event.recordingLink,
    generated_emails: event.generatedEmails,
    created_at: event.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function dbEventToLocal(row: any): PanelEvent {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    panelTitle: row.panel_title || '',
    panelSubtitle: row.panel_subtitle || '',
    panelPurpose: row.panel_purpose || '',
    eventDate: row.event_date || '',
    eventDateFull: row.event_date_full || '',
    eventDateShort: row.event_date_short || '',
    eventDateMinus1: row.event_date_minus1 || '',
    discussionPoints: row.discussion_points || [],
    briefTopicDescription: row.brief_topic_description || '',
    panelists: row.panelists || [],
    recordingLink: row.recording_link,
    generatedEmails: row.generated_emails || [],
  };
}

function localChecklistToDb(checklist: EventChecklist, userId: string) {
  return {
    id: checklist.id,
    user_id: userId,
    event_id: checklist.eventId,
    event_type: checklist.eventType,
    event_topic: checklist.eventTopic,
    event_presenter: checklist.eventPresenter,
    event_date: checklist.eventDate,
    event_time: checklist.eventTime,
    allocated_ae: checklist.allocatedAE,
    number_of_speakers: checklist.numberOfSpeakers,
    team_member: checklist.teamMember,
    team_lead: checklist.teamLead,
    sheet_url: checklist.sheetUrl,
    tasks: checklist.tasks,
    created_at: checklist.createdAt,
    updated_at: checklist.updatedAt,
  };
}

function dbChecklistToLocal(row: any): EventChecklist {
  return {
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type || '',
    eventTopic: row.event_topic || '',
    eventPresenter: row.event_presenter || '',
    eventDate: row.event_date || '',
    eventTime: row.event_time || '',
    allocatedAE: row.allocated_ae || '',
    numberOfSpeakers: row.number_of_speakers || 0,
    teamMember: row.team_member || '',
    teamLead: row.team_lead || '',
    sheetUrl: row.sheet_url,
    tasks: row.tasks || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function localTrackerToDb(tracker: EventPanelTracker, userId: string) {
  return {
    id: tracker.id,
    user_id: userId,
    event_id: tracker.eventId,
    event_name: tracker.eventName,
    event_date: tracker.eventDate,
    product: tracker.product,
    sheet_name: tracker.sheetName,
    total_registrations: tracker.totalRegistrations,
    total_icp_registrations: tracker.totalIcpRegistrations,
    total_non_icp_registrations: tracker.totalNonIcpRegistrations,
    total_attendees: tracker.totalAttendees,
    icp_attendees: tracker.icpAttendees,
    non_icp_attendees: tracker.nonIcpAttendees,
    direct_registrations: tracker.directRegistrations,
    partner_registrations: tracker.partnerRegistrations,
    direct_msms_booked: tracker.directMsmsBooked,
    direct_icp_msms_booked: tracker.directIcpMsmsBooked,
    bdr_msms_booked: tracker.bdrMsmsBooked,
    bdr_icp_msms_booked: tracker.bdrIcpMsmsBooked,
    direct_msms_completed: tracker.directMsmsCompleted,
    bdr_msms_completed: tracker.bdrMsmsCompleted,
    total_icp_msms_booked: tracker.totalIcpMsmsBooked,
    total_icp_msms_completed: tracker.totalIcpMsmsCompleted,
    attendee_list_link: tracker.attendeeListLink,
    lead_list_shared_with_sales: tracker.leadListSharedWithSales,
    registrations: tracker.registrations,
    raw_rows: tracker.rawRows,
    created_at: tracker.createdAt,
    updated_at: tracker.updatedAt,
  };
}

function dbTrackerToLocal(row: any): EventPanelTracker {
  return {
    id: row.id,
    eventId: row.event_id,
    eventName: row.event_name || '',
    eventDate: row.event_date || '',
    product: row.product || 'VET',
    sheetName: row.sheet_name,
    totalRegistrations: row.total_registrations || 0,
    totalIcpRegistrations: row.total_icp_registrations || 0,
    totalNonIcpRegistrations: row.total_non_icp_registrations || 0,
    totalAttendees: row.total_attendees || 0,
    icpAttendees: row.icp_attendees || 0,
    nonIcpAttendees: row.non_icp_attendees || 0,
    directRegistrations: row.direct_registrations || 0,
    partnerRegistrations: row.partner_registrations || 0,
    directMsmsBooked: row.direct_msms_booked || 0,
    directIcpMsmsBooked: row.direct_icp_msms_booked || 0,
    bdrMsmsBooked: row.bdr_msms_booked || 0,
    bdrIcpMsmsBooked: row.bdr_icp_msms_booked || 0,
    directMsmsCompleted: row.direct_msms_completed || 0,
    bdrMsmsCompleted: row.bdr_msms_completed || 0,
    totalIcpMsmsBooked: row.total_icp_msms_booked || 0,
    totalIcpMsmsCompleted: row.total_icp_msms_completed || 0,
    attendeeListLink: row.attendee_list_link,
    leadListSharedWithSales: row.lead_list_shared_with_sales,
    registrations: row.registrations || [],
    rawRows: row.raw_rows,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
