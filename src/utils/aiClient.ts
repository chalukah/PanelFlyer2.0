import type { PanelEvent, EventPanelTracker } from '../types';

// --- Types ---

export type AIStatus = {
  connected: boolean;
  model?: string;
  bin?: string;
  error?: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type AIModel = {
  id: string;
  label: string;
  description: string;
};

export const AI_MODELS: AIModel[] = [
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: 'Complex reasoning & analysis' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', description: 'Balanced - best for most tasks' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', description: 'Fast drafts & classification' },
];

// --- API Client ---

export async function checkAIStatus(): Promise<AIStatus> {
  try {
    const res = await fetch('/api/ai/status');
    return await res.json();
  } catch {
    return { connected: false, error: 'AI server not running' };
  }
}

export async function setAIModel(model: string): Promise<void> {
  await fetch('/api/ai/model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });
}

export async function streamGenerate(
  prompt: string,
  options: {
    model?: string;
    context?: string;
    signal?: AbortSignal;
    onChunk: (text: string) => void;
  }
): Promise<string> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: options.model,
      context: options.context,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI request failed: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    options.onChunk(chunk);
  }

  return fullText;
}

export async function streamChat(
  messages: ChatMessage[],
  options: {
    model?: string;
    context?: string;
    signal?: AbortSignal;
    onChunk: (text: string) => void;
  }
): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      model: options.model,
      context: options.context,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI chat failed: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    options.onChunk(chunk);
  }

  return fullText;
}

// --- Context Serialization ---

export function serializeEventContext(
  event: PanelEvent | undefined,
  tracker?: EventPanelTracker
): string {
  if (!event) return '';

  const lines: string[] = [
    `Panel: ${event.name}`,
    `Title: ${event.panelTitle}`,
    `Subtitle: ${event.panelSubtitle}`,
    `Date: ${event.eventDateFull}`,
    `Purpose: ${event.panelPurpose}`,
  ];

  if (event.briefTopicDescription) {
    lines.push(`Topic: ${event.briefTopicDescription}`);
  }

  if (event.discussionPoints?.length > 0) {
    lines.push('Discussion Points:');
    event.discussionPoints.forEach((dp, i) => {
      if (dp) lines.push(`  ${i + 1}. ${dp}`);
    });
  }

  if (event.panelists?.length > 0) {
    lines.push(`\nPanelists (${event.panelists.length}):`);
    event.panelists.forEach((p) => {
      const parts = [p.fullName];
      if (p.title) parts.push(`- ${p.title}`);
      if (p.email) parts.push(`(${p.email})`);
      lines.push(`  - ${parts.join(' ')}`);
    });
  }

  lines.push(`\nEmails Generated: ${event.generatedEmails?.length ?? 0}`);

  if (tracker) {
    lines.push(`\nRegistration Summary:`);
    lines.push(`  Total Registrations: ${tracker.totalRegistrations}`);
    lines.push(`  ICP Registrations: ${tracker.totalIcpRegistrations}`);
    lines.push(`  Total Attendees: ${tracker.totalAttendees}`);
    lines.push(`  ICP Attendees: ${tracker.icpAttendees}`);
  }

  if (event.recordingLink) {
    lines.push(`\nRecording: ${event.recordingLink}`);
  }

  return lines.join('\n');
}

// --- Activity Log ---

export type AIActivity = {
  id: string;
  timestamp: string;
  promptSummary: string;
  model: string;
  status: 'success' | 'error' | 'aborted';
};

const ACTIVITY_KEY = 'vbi-ai-activity';
const MAX_ACTIVITIES = 20;

export function getActivityLog(): AIActivity[] {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addActivity(activity: Omit<AIActivity, 'id' | 'timestamp'>): void {
  const log = getActivityLog();
  log.unshift({
    ...activity,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
  });
  if (log.length > MAX_ACTIVITIES) log.length = MAX_ACTIVITIES;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
}
