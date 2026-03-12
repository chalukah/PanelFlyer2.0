import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, RotateCcw, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePanelStore } from '../panelStore';
import {
  streamChat,
  serializeEventContext,
  addActivity,
  type ChatMessage,
} from '../utils/aiClient';

type AIChatProps = {
  model: string;
  initialPrompt?: string;
  onInitialPromptConsumed?: () => void;
};

export function AIChat({ model, initialPrompt, onInitialPromptConsumed }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedEventId = usePanelStore((s) => s.ui.selectedEventId);
  const panelEvents = usePanelStore((s) => s.panelEvents);
  const eventPanelTrackers = usePanelStore((s) => s.eventPanelTrackers);

  const selectedEvent = panelEvents.find((e) => e.id === selectedEventId);
  const tracker = eventPanelTrackers.find((t) => t.eventId === selectedEventId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput('');
      setIsStreaming(true);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages([...newMessages, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      const context = serializeEventContext(selectedEvent, tracker);
      const promptSummary =
        content.length > 60 ? content.slice(0, 60) + '...' : content;

      try {
        await streamChat([...newMessages], {
          model,
          context: context || undefined,
          signal: controller.signal,
          onChunk: (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + chunk,
                };
              }
              return updated;
            });
          },
        });

        addActivity({ promptSummary, model, status: 'success' });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          addActivity({ promptSummary, model, status: 'aborted' });
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content:
                  last.content +
                  '\n\n*Error: ' +
                  (err instanceof Error ? err.message : 'Unknown error') +
                  '*',
              };
            }
            return updated;
          });
          addActivity({ promptSummary, model, status: 'error' });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, model, selectedEvent, tracker]
  );

  // Handle initial prompt from quick actions
  useEffect(() => {
    if (initialPrompt && !isStreaming) {
      sendMessage(initialPrompt);
      onInitialPromptConsumed?.();
    }
  }, [initialPrompt]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleClear = () => {
    if (isStreaming) handleStop();
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [input]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#FF90E8]" />
          <span className="text-sm font-medium">AI Chat</span>
          {selectedEvent && (
            <span className="text-xs text-gray-500">
              - {selectedEvent.name}
            </span>
          )}
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          title="New Chat"
        >
          <RotateCcw className="w-3 h-3" />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Bot className="w-12 h-12 mb-3 text-gray-400" />
            <p className="text-sm text-gray-500">
              Ask me anything about your panel events.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {selectedEvent
                ? `Context: ${selectedEvent.name}`
                : 'Select an event for contextual answers'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-[#FF90E8] text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>

            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#FF90E8] text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}
                  </ReactMarkdown>
                  {isStreaming && i === messages.length - 1 && msg.content && (
                    <span className="inline-block w-2 h-4 bg-[#FF90E8] animate-pulse ml-0.5" />
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'Waiting for response...'
                : 'Ask about your panel event... (Enter to send, Shift+Enter for newline)'
            }
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8] disabled:opacity-50 placeholder:text-gray-400"
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Stop generation"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-[#FF90E8] text-white hover:bg-[#ff7ae0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
