import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PanelEvent, Panelist, GeneratedEmail, EventChecklist, EventPanelTracker } from './types';
import { EMAIL_TEMPLATES } from './data/emailTemplates';
import { replaceVariables, processConditionalSections, generateSubjectLine, validateTemplate } from './utils/templateEngine';
import { wrapEmailContent, extractEmailContent, createSignature } from './utils/emailTemplateWrapper';
import { EVENT_CHECKLIST_SEEDS } from './data/eventChecklistTemplate';
import * as sync from './lib/supabaseSync';

type UIState = {
  theme: 'system' | 'light' | 'dark';
  sidebarOpen: boolean;
  emailListCollapsed: boolean;
  selectedEventId?: string;
  selectedEmailId?: string;
  showEmailPreview: boolean;
  searchModalOpen: boolean;
  confirmDialog?: {
    title: string;
    message: string;
    onConfirm: () => void;
  };
  toast?: {
    message: string;
    type: 'success' | 'error' | 'info';
  };
};

type PanelStore = {
  panelEvents: PanelEvent[];
  eventChecklists: EventChecklist[];
  eventPanelTrackers: EventPanelTracker[];
  ui: UIState;

  // Event CRUD
  createEvent: (event: Omit<PanelEvent, 'id' | 'createdAt' | 'generatedEmails'>) => string;
  updateEvent: (id: string, updates: Partial<PanelEvent>) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => string;

  // Panelist Management
  addPanelist: (eventId: string, panelist: Omit<Panelist, 'id'>) => void;
  updatePanelist: (eventId: string, panelistId: string, updates: Partial<Panelist>) => void;
  deletePanelist: (eventId: string, panelistId: string) => void;
  importPanelists: (eventId: string, panelists: Omit<Panelist, 'id'>[]) => void;

  // Email Generation
  generateEmails: (eventId: string) => void;
  regenerateEmail: (eventId: string, emailId: string, options?: { silent?: boolean }) => void;
  regenerateAllEmails: () => void;
  updateGeneratedEmail: (eventId: string, emailId: string, htmlContent: string) => void;
  deleteGeneratedEmail: (eventId: string, emailId: string) => void;

  // Post-Event Data
  updatePostEventData: (
    eventId: string,
    data: {
      recordingLink?: string;
      panelistUpdates?: Array<{
        panelistId: string;
        registrationCount?: number;
        attendeeListLink?: string;
        contributionSummary?: string;
      }>;
    }
  ) => void;

  // Event Checklist Management
  createEventChecklist: (checklist: Omit<EventChecklist, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEventChecklist: (id: string, updates: Partial<EventChecklist>) => void;
  deleteEventChecklist: (id: string) => void;
  importEventChecklist: (checklist: EventChecklist) => void;

  // Event Panel Tracker Management
  createEventPanelTracker: (tracker: Omit<EventPanelTracker, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEventPanelTracker: (id: string, updates: Partial<EventPanelTracker>, options?: { silent?: boolean }) => void;
  deleteEventPanelTracker: (id: string) => void;
  importEventPanelTracker: (tracker: EventPanelTracker) => void;

  // Export/Import
  exportEvent: (eventId: string) => string;
  importEvent: (json: string) => boolean;

  // UI Actions
  setTheme: (theme: 'system' | 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleEmailList: () => void;
  selectEvent: (eventId?: string) => void;
  selectEmail: (emailId?: string) => void;
  setShowEmailPreview: (show: boolean) => void;
  setSearchModalOpen: (open: boolean) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirm: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
};

function cloneChecklist(template: EventChecklist): EventChecklist {
  return {
    ...template,
    tasks: template.tasks.map((task) => ({ ...task }))
  };
}

function normalizeQuestions(questions?: string[]): string[] {
  const normalized = Array.isArray(questions) ? [...questions] : [];
  while (normalized.length < 5) {
    normalized.push('');
  }
  return normalized;
}

function normalizePanelistData(panelist: Panelist): Panelist {
  return {
    ...panelist,
    firstName: panelist.firstName || '',
    fullName: panelist.fullName || panelist.firstName || '',
    email: panelist.email || '',
    zoomJoinLink: panelist.zoomJoinLink || '',
    registrationTrackingLink: panelist.registrationTrackingLink || '',
    promotionalMaterialsLink: panelist.promotionalMaterialsLink || '',
    questionsLink: panelist.questionsLink || '',
    finalBannerLink: panelist.finalBannerLink || '',
    questions: normalizeQuestions(panelist.questions),
    promoPost1Link: panelist.promoPost1Link || '',
    promoPost2Link: panelist.promoPost2Link || '',
    promoPost3Link: panelist.promoPost3Link || '',
    promoPost4Link: panelist.promoPost4Link || '',
    promoPost5Link: panelist.promoPost5Link || '',
    promoDraft1Link: panelist.promoDraft1Link || '',
    promoDraft2Link: panelist.promoDraft2Link || '',
    promoDraft3Link: panelist.promoDraft3Link || '',
    promoDraft4Link: panelist.promoDraft4Link || '',
  };
}

function normalizeEventData(event: PanelEvent): PanelEvent {
  const discussionPoints = Array.isArray(event.discussionPoints)
    ? [...event.discussionPoints]
    : [];
  while (discussionPoints.length < 5) {
    discussionPoints.push('');
  }

  return {
    ...event,
    discussionPoints,
    panelists: Array.isArray(event.panelists)
      ? event.panelists.map((panelist) => normalizePanelistData(panelist))
      : [],
    generatedEmails: Array.isArray(event.generatedEmails) ? event.generatedEmails : [],
  };
}

export const usePanelStore = create<PanelStore>()(
  persist(
    (set, get) => ({
      panelEvents: [],
      eventChecklists: EVENT_CHECKLIST_SEEDS.map((checklist) => cloneChecklist(checklist)),
      eventPanelTrackers: [],
      ui: {
        theme: 'light',
        sidebarOpen: true,
        emailListCollapsed: false,
        showEmailPreview: true,
        searchModalOpen: false,
      },

      createEvent: (eventData) => {
        const id = crypto.randomUUID();
        const newEvent: PanelEvent = {
          ...eventData,
          id,
          createdAt: new Date().toISOString(),
          generatedEmails: [],
        };
        const normalizedEvent = normalizeEventData(newEvent);

        set((state) => ({
          panelEvents: [...state.panelEvents, normalizedEvent],
        }));

        get().showToast('Panel event created', 'success');
        // Sync to Supabase (background, non-blocking)
        sync.upsertEvent(normalizedEvent).catch(() => {});
        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          panelEvents: state.panelEvents.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
        // Sync to Supabase
        const updated = get().panelEvents.find(e => e.id === id);
        if (updated) sync.upsertEvent(updated).catch(() => {});
      },

      deleteEvent: (id) => {
        set((state) => ({
          panelEvents: state.panelEvents.filter((e) => e.id !== id),
          ui: {
            ...state.ui,
            selectedEventId: state.ui.selectedEventId === id ? undefined : state.ui.selectedEventId,
          },
        }));
        get().showToast('Event deleted', 'success');
        sync.deleteEventRemote(id).catch(() => {});
      },

      duplicateEvent: (id) => {
        const event = get().panelEvents.find((e) => e.id === id);
        if (!event) return '';

        const newId = crypto.randomUUID();
        const newEvent: PanelEvent = {
          ...event,
          id: newId,
          name: `${event.name} (Copy)`,
          createdAt: new Date().toISOString(),
          panelists: event.panelists.map((p) => ({
            ...p,
            id: crypto.randomUUID(),
          })),
          generatedEmails: [],
        };
        const normalizedEvent = normalizeEventData(newEvent);

        set((state) => ({
          panelEvents: [...state.panelEvents, normalizedEvent],
        }));

        get().showToast('Event duplicated', 'success');
        sync.upsertEvent(normalizedEvent).catch(() => {});
        return newId;
      },

      addPanelist: (eventId, panelistData) => {
        const panelist: Panelist = {
          ...panelistData,
          id: crypto.randomUUID(),
        };
        const normalizedPanelist = normalizePanelistData(panelist);

        set((state) => ({
          panelEvents: state.panelEvents.map((event) =>
            event.id === eventId
              ? { ...event, panelists: [...event.panelists, normalizedPanelist] }
              : event
          ),
        }));

        get().showToast('Panelist added', 'success');
        const ev = get().panelEvents.find(e => e.id === eventId);
        if (ev) sync.upsertEvent(ev).catch(() => {});
      },

      updatePanelist: (eventId, panelistId, updates) => {
        set((state) => ({
          panelEvents: state.panelEvents.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  panelists: event.panelists.map((p) =>
                    p.id === panelistId
                      ? normalizePanelistData({ ...p, ...updates })
                      : p
                  ),
                }
              : event
          ),
        }));
      },

      deletePanelist: (eventId, panelistId) => {
        set((state) => ({
          panelEvents: state.panelEvents.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  panelists: event.panelists.filter((p) => p.id !== panelistId),
                }
              : event
          ),
        }));
        get().showToast('Panelist removed', 'success');
        const ev = get().panelEvents.find(e => e.id === eventId);
        if (ev) sync.upsertEvent(ev).catch(() => {});
      },

      importPanelists: (eventId, panelists) => {
        const panelistsWithIds = panelists.map((p) => ({
          ...p,
          id: crypto.randomUUID(),
        }));
        const normalizedPanelists = panelistsWithIds.map((panelist) =>
          normalizePanelistData(panelist)
        );

        set((state) => ({
          panelEvents: state.panelEvents.map((event) =>
            event.id === eventId
              ? { ...event, panelists: normalizedPanelists }
              : event
          ),
        }));

        get().showToast(`${panelists.length} panelists imported`, 'success');
        const ev = get().panelEvents.find(e => e.id === eventId);
        if (ev) sync.upsertEvent(ev).catch(() => {});
      },

      generateEmails: (eventId) => {
        const event = get().panelEvents.find((e) => e.id === eventId);
        if (!event) return;

        const generatedEmails: GeneratedEmail[] = [];

        EMAIL_TEMPLATES.forEach((template) => {
          if (template.perPanelist) {
            // Generate one email per panelist
            event.panelists.forEach((panelist) => {
              let content = replaceVariables(template.template, event, panelist);

              // Handle conditional sections for E+1 Thank You email
              if (template.code === 'E+1') {
                content = processConditionalSections(content, panelist.registrationCount);
              }

              // Extract content from old template format
              const emailContent = extractEmailContent(content);

              // Determine wrapper options based on template
              const includeNoteBox = template.code === 'QUESTIONS';
              const includeQuestionList = template.code === 'QUESTIONS';

              // Generate filename for title
              const emailTitle = `${template.name} - ${panelist.fullName}`;

              // Wrap in modern template
              const htmlContent = wrapEmailContent(emailContent, {
                title: emailTitle,
                includeNoteBox,
                includeQuestionList,
              });
              const validation = validateTemplate(htmlContent);

              generatedEmails.push({
                id: crypto.randomUUID(),
                templateId: template.id,
                panelistId: panelist.id,
                subject: generateSubjectLine(template.code, template.name, event, panelist),
                htmlContent,
                generatedAt: new Date().toISOString(),
                missingVariables: validation.missingVariables,
              });
            });
          } else {
            // Generate one email for all panelists
            let content = replaceVariables(template.template, event);

            // Extract content from old template format
            const emailContent = extractEmailContent(content);

            // Generate filename for title
            const emailTitle = `${template.name} - All Panelists`;

            // Wrap in modern template
            const htmlContent = wrapEmailContent(emailContent, {
              title: emailTitle,
              includeNoteBox: false,
              includeQuestionList: false,
            });
            const validation = validateTemplate(htmlContent);

            generatedEmails.push({
              id: crypto.randomUUID(),
              templateId: template.id,
              subject: generateSubjectLine(template.code, template.name, event),
              htmlContent,
              generatedAt: new Date().toISOString(),
              missingVariables: validation.missingVariables,
            });
          }
        });

        set((state) => {
          // Preserve selected email by matching templateId and panelistId
          let nextSelectedEmailId = state.ui.selectedEmailId;
          if (state.ui.selectedEventId === eventId && nextSelectedEmailId) {
            const currentEvent = state.panelEvents.find((e) => e.id === eventId);
            const currentEmail = currentEvent?.generatedEmails.find(
              (e) => e.id === nextSelectedEmailId
            );
            
            if (currentEmail) {
              // Find the equivalent email after regeneration
              const equivalentEmail = generatedEmails.find(
                (e) =>
                  e.templateId === currentEmail.templateId &&
                  e.panelistId === currentEmail.panelistId
              );
              if (equivalentEmail) {
                nextSelectedEmailId = equivalentEmail.id;
              } else {
                // If no equivalent found, try to keep the same template
                const sameTemplateEmail = generatedEmails.find(
                  (e) => e.templateId === currentEmail.templateId
                );
                nextSelectedEmailId = sameTemplateEmail?.id || generatedEmails[0]?.id;
              }
            } else {
              // Current email doesn't exist, select first available
              nextSelectedEmailId = generatedEmails[0]?.id;
            }
          }

          const updatedEvents = state.panelEvents.map((e) =>
            e.id === eventId ? { ...e, generatedEmails } : e
          );

          return {
            panelEvents: updatedEvents,
            ui: {
              ...state.ui,
              selectedEmailId: nextSelectedEmailId,
            },
          };
        });

        get().showToast(
          `${generatedEmails.length} emails generated successfully`,
          'success'
        );
      },

      regenerateEmail: (eventId, emailId, options) => {
        const event = get().panelEvents.find((e) => e.id === eventId);
        if (!event) return;

        const email = event.generatedEmails.find((e) => e.id === emailId);
        if (!email) return;

        const template = EMAIL_TEMPLATES.find((t) => t.id === email.templateId);
        if (!template) return;

        const panelist = email.panelistId
          ? event.panelists.find((p) => p.id === email.panelistId)
          : undefined;

        let content = replaceVariables(template.template, event, panelist);

        if (template.code === 'E+1' && panelist) {
          content = processConditionalSections(content, panelist.registrationCount);
        }

        // Extract content from old template format
        const emailContent = extractEmailContent(content);

        // Determine wrapper options based on template
        const includeNoteBox = template.code === 'QUESTIONS';
        const includeQuestionList = template.code === 'QUESTIONS';

        // Generate filename for title
        const emailTitle = panelist
          ? `${template.name} - ${panelist.fullName}`
          : `${template.name} - All Panelists`;

        // Wrap in modern template
        const htmlContent = wrapEmailContent(emailContent, {
          title: emailTitle,
          includeNoteBox,
          includeQuestionList,
        });
        const validation = validateTemplate(htmlContent);

        set((state) => ({
          panelEvents: state.panelEvents.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  generatedEmails: e.generatedEmails.map((ge) =>
                    ge.id === emailId
                      ? {
                          ...ge,
                          htmlContent,
                          generatedAt: new Date().toISOString(),
                          missingVariables: validation.missingVariables,
                        }
                      : ge
                  ),
                }
              : e
          ),
        }));

        if (!options?.silent) {
          get().showToast('Email regenerated', 'success');
        }
      },

      regenerateAllEmails: () => {
        const state = get();
        const events = state.panelEvents;
        let totalRegenerated = 0;

        // Preserve selected email info before regeneration
        const selectedEventId = state.ui.selectedEventId;
        const selectedEmailId = state.ui.selectedEmailId;
        let preservedEmailInfo: { templateId: string; panelistId?: string } | null = null;

        if (selectedEventId && selectedEmailId) {
          const selectedEvent = events.find((e) => e.id === selectedEventId);
          const selectedEmail = selectedEvent?.generatedEmails.find(
            (e) => e.id === selectedEmailId
          );
          if (selectedEmail) {
            preservedEmailInfo = {
              templateId: selectedEmail.templateId,
              panelistId: selectedEmail.panelistId,
            };
          }
        }

        events.forEach((event) => {
          if (event.panelists.length > 0) {
            get().generateEmails(event.id);
            totalRegenerated++;
          }
        });

        // Restore selected email after regeneration if it was preserved
        if (preservedEmailInfo && selectedEventId) {
          const updatedState = get();
          const updatedEvent = updatedState.panelEvents.find((e) => e.id === selectedEventId);
          const equivalentEmail = updatedEvent?.generatedEmails.find(
            (e) =>
              e.templateId === preservedEmailInfo!.templateId &&
              e.panelistId === preservedEmailInfo!.panelistId
          );
          if (equivalentEmail) {
            set((s) => ({
              ui: {
                ...s.ui,
                selectedEmailId: equivalentEmail.id,
              },
            }));
          }
        }

        get().showToast(
          `Successfully regenerated emails for ${totalRegenerated} panel event(s)`,
          'success'
        );
      },

      updateGeneratedEmail: (eventId, emailId, htmlContent) => {
        const validation = validateTemplate(htmlContent);
        set((state) => ({
          panelEvents: state.panelEvents.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  generatedEmails: e.generatedEmails.map((ge) =>
                    ge.id === emailId
                      ? { ...ge, htmlContent, missingVariables: validation.missingVariables }
                      : ge
                  ),
                }
              : e
          ),
        }));
      },

      deleteGeneratedEmail: (eventId, emailId) => {
        set((state) => ({
          panelEvents: state.panelEvents.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  generatedEmails: e.generatedEmails.filter((ge) => ge.id !== emailId),
                }
              : e
          ),
        }));
      },

      updatePostEventData: (eventId, data) => {
        set((state) => ({
          panelEvents: state.panelEvents.map((event) => {
            if (event.id !== eventId) return event;

            let updatedEvent = { ...event };

            if (data.recordingLink) {
              updatedEvent.recordingLink = data.recordingLink;
            }

            if (data.panelistUpdates) {
              updatedEvent.panelists = event.panelists.map((panelist) => {
                const update = data.panelistUpdates!.find(
                  (u) => u.panelistId === panelist.id
                );
                return update ? { ...panelist, ...update } : panelist;
              });
            }

            return updatedEvent;
          }),
        }));

        get().showToast('Post-event data updated', 'success');
      },

      exportEvent: (eventId) => {
        const event = get().panelEvents.find((e) => e.id === eventId);
        if (!event) return '';
        return JSON.stringify(event, null, 2);
      },

      importEvent: (json) => {
        try {
          const event = JSON.parse(json) as PanelEvent;
          event.id = crypto.randomUUID();
          event.createdAt = new Date().toISOString();
          const normalizedEvent = normalizeEventData(event);

          set((state) => ({
            panelEvents: [...state.panelEvents, normalizedEvent],
          }));

          get().showToast('Event imported successfully', 'success');
          return true;
        } catch (error) {
          get().showToast('Failed to import event', 'error');
          return false;
        }
      },

      setTheme: (theme) => {
        set((state) => ({ ui: { ...state.ui, theme } }));
        applyTheme(theme);
      },

      toggleSidebar: () => {
        set((state) => ({ ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } }));
      },

      setSidebarOpen: (open) => {
        set((state) => ({ ui: { ...state.ui, sidebarOpen: open } }));
      },

      toggleEmailList: () => {
        set((state) => ({ ui: { ...state.ui, emailListCollapsed: !state.ui.emailListCollapsed } }));
      },

      selectEvent: (eventId) => {
        set((state) => ({ ui: { ...state.ui, selectedEventId: eventId } }));
      },

      selectEmail: (emailId) => {
        set((state) => ({ ui: { ...state.ui, selectedEmailId: emailId } }));
      },

      setShowEmailPreview: (show) => {
        set((state) => ({ ui: { ...state.ui, showEmailPreview: show } }));
      },

      setSearchModalOpen: (open) => {
        set((state) => ({ ui: { ...state.ui, searchModalOpen: open } }));
      },

      showConfirm: (title, message, onConfirm) => {
        set((state) => ({
          ui: { ...state.ui, confirmDialog: { title, message, onConfirm } },
        }));
      },

      hideConfirm: () => {
        set((state) => ({ ui: { ...state.ui, confirmDialog: undefined } }));
      },

      showToast: (message, type = 'info') => {
        set((state) => ({ ui: { ...state.ui, toast: { message, type } } }));
        setTimeout(() => get().hideToast(), 3000);
      },

      hideToast: () => {
        set((state) => ({ ui: { ...state.ui, toast: undefined } }));
      },

      // Event Checklist Management
      createEventChecklist: (checklistData) => {
        const id = crypto.randomUUID();
        const newChecklist: EventChecklist = {
          ...checklistData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          eventChecklists: [...state.eventChecklists, newChecklist],
        }));

        get().showToast('Event checklist created', 'success');
        sync.upsertChecklist(newChecklist).catch(() => {});
        return id;
      },

      updateEventChecklist: (id, updates) => {
        set((state) => ({
          eventChecklists: state.eventChecklists.map((checklist) =>
            checklist.id === id
              ? { ...checklist, ...updates, updatedAt: new Date().toISOString() }
              : checklist
          ),
        }));
        get().showToast('Checklist updated', 'success');
      },

      deleteEventChecklist: (id) => {
        set((state) => ({
          eventChecklists: state.eventChecklists.filter((c) => c.id !== id),
        }));
        get().showToast('Checklist deleted', 'success');
      },

      importEventChecklist: (checklist) => {
        const newChecklist: EventChecklist = {
          ...checklist,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          eventChecklists: [...state.eventChecklists, newChecklist],
        }));

        get().showToast('Event checklist imported', 'success');
      },

      // Event Panel Tracker Management
      createEventPanelTracker: (trackerData) => {
        const id = crypto.randomUUID();
        const newTracker: EventPanelTracker = {
          ...trackerData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawRows: trackerData.rawRows || [],
        };

        set((state) => ({
          eventPanelTrackers: [...state.eventPanelTrackers, newTracker],
        }));

        get().showToast('Event panel tracker created', 'success');
        sync.upsertTracker(newTracker).catch(() => {});
        return id;
      },

      updateEventPanelTracker: (id, updates, options) => {
        const nextUpdatedAt = updates.updatedAt || new Date().toISOString();
        set((state) => ({
          eventPanelTrackers: state.eventPanelTrackers.map((tracker) =>
            tracker.id === id
              ? { ...tracker, ...updates, updatedAt: nextUpdatedAt }
              : tracker
          ),
        }));
        if (!options?.silent) {
          get().showToast('Tracker updated', 'success');
        }
      },

      deleteEventPanelTracker: (id) => {
        set((state) => ({
          eventPanelTrackers: state.eventPanelTrackers.filter((t) => t.id !== id),
        }));
        get().showToast('Tracker deleted', 'success');
      },

      importEventPanelTracker: (tracker) => {
        const newTracker: EventPanelTracker = {
          ...tracker,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawRows: tracker.rawRows || [],
        };

        set((state) => ({
          eventPanelTrackers: [...state.eventPanelTrackers, newTracker],
        }));

        get().showToast('Event panel tracker imported', 'success');
      },
    }),
    {
      name: 'vbi-panel-store',
      partialize: (state) => ({
        panelEvents: state.panelEvents,
        eventChecklists: state.eventChecklists,
        eventPanelTrackers: state.eventPanelTrackers,
        ui: {
          theme: state.ui.theme,
          sidebarOpen: state.ui.sidebarOpen,
          emailListCollapsed: state.ui.emailListCollapsed,
          showEmailPreview: state.ui.showEmailPreview,
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.ui.theme);

          // Remove any "Untitled Checklist" entries and ensure seed templates are present
          const seedIds = EVENT_CHECKLIST_SEEDS.map(s => s.id);
          const existingIds = state.eventChecklists.map(c => c.id);

          // Filter out untitled checklists
          const filteredChecklists = state.eventChecklists.filter(
            c => c.eventType !== 'Untitled Checklist' && c.eventTopic !== ''
          );

          // Add any missing seed templates
          const missingSeeds = EVENT_CHECKLIST_SEEDS.filter(
            seed => !existingIds.includes(seed.id)
          );

          state.eventChecklists = [
            ...missingSeeds.map(cloneChecklist),
            ...filteredChecklists
          ];

          state.panelEvents = (state.panelEvents || []).map((event) =>
            normalizeEventData(event)
          );
        }
      },
    }
  )
);

function applyTheme(theme: 'system' | 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// Listen to system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const theme = usePanelStore.getState().ui.theme;
    if (theme === 'system') {
      applyTheme('system');
    }
  });
}
