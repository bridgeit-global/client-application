'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AIAnalystChatProps = {
  orgId: string;
  orgName: string;
};

const SUGGESTED_PROMPTS = [
  'Show my top 5 highest electricity bills in the last 12 months with site names and bill_ids.',
  'Where am I paying the most LPSC penalties? List sites with total LPSC in ₹ and bill_ids.',
  'Identify abnormal bills in the last 6 months and explain why they are marked abnormal.',
  'Which sites have the highest missed rebate potential in the last 3 cycles?',
  'Summarise my overall portfolio: total spend, LPSC, PF penalties, and missed rebates.'
];

export default function AIAnalystChat({ orgId, orgName }: AIAnalystChatProps) {
  const [input, setInput] = useState('');

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat/analyst',
        body: { org_id: orgId }
      }),
    [orgId]
  );

  const { messages, sendMessage, isLoading, error, stop } = useChat({
    transport
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isLoading]);

  const hasMessages = messages.length > 0;

  const submit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col rounded-lg border bg-background">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!hasMessages && (
          <div className="rounded-lg border bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Ask anything about your electricity bills for {orgName}.
            </p>
            <p className="mt-1">
              The AI analyst will always query your live portal data (filtered by your
              organization) before answering. It can analyse trends, penalties, rebates,
              anomalies, and portfolio performance.
            </p>
            <p className="mt-2 text-xs">
              Tip: be specific with bill IDs, account numbers, sites, or date ranges for
              the most actionable insights.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="whitespace-normal text-left text-xs"
                  onClick={() => {
                    if (isLoading) return;
                    sendMessage({ text: prompt });
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message: any) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-xl rounded-2xl px-3 py-2 text-sm shadow-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              {message.role === 'user'
                ? renderUserMessage(message)
                : renderAssistantMessage(message)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Thinking with live bill data…
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive">
            {(error as any)?.message ?? 'Something went wrong. Please try again.'}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-background px-4 py-3">
        <div className="flex flex-col gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about bills, LPSC, PF penalties, rebates, or anomalies…"
            rows={2}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for a new line.
            </p>
            <div className="flex items-center gap-2">
              {isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stop()}
                >
                  Stop
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={isLoading || input.trim().length === 0}
                onClick={submit}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderUserMessage(message: any) {
  const textParts = (message.parts ?? []).filter(
    (part: any) => part.type === 'text'
  );

  if (!textParts.length) return null;

  return (
    <div className="whitespace-pre-wrap">
      {textParts.map((part: any, index: number) => (
        <span key={index}>{part.text}</span>
      ))}
    </div>
  );
}

function renderAssistantMessage(message: any) {
  const parts = message.parts ?? [];

  return (
    <div className="space-y-3">
      {parts.map((part: any, index: number) => {
        if (part.type === 'text') {
          return (
            <div
              key={index}
              className="prose prose-sm dark:prose-invert prose-headings:mb-2 prose-p:mb-2 prose-ul:mb-2 prose-ol:mb-2"
            >
              <ReactMarkdown>{part.text}</ReactMarkdown>
            </div>
          );
        }

        if (part.type === 'tool-execute_query') {
          const args = (part.args ?? {}) as {
            sql?: string;
            reasoning?: string;
          };
          const result = part.result as
            | { rows?: unknown; reasoning?: string; error?: string }
            | undefined;

          return (
            <div
              key={index}
              className="rounded-md border bg-background/60 p-2 text-xs"
            >
              <div className="font-medium text-foreground">
                Database query executed
              </div>
              {args.reasoning && (
                <div className="mt-1 text-muted-foreground">
                  {args.reasoning}
                </div>
              )}
              {args.sql && (
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-[10px] leading-snug">
                  <code>{args.sql}</code>
                </pre>
              )}
              {result && result.error && (
                <div className="mt-2 text-destructive">
                  Query error: {result.error}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

