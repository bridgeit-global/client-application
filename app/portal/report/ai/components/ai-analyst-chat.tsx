'use client';

import { useRef, useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  SendHorizontal,
  ThumbsUp,
  ThumbsDown,
  Database,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, exportToExcel } from '@/lib/utils';
import QueryChart from './query-chart';
import BillDocumentLinks from './bill-document-links';

type AIAnalystChatProps = {
  orgId: string;
  orgName: string;
};

const SUGGESTED_PROMPTS = [
  {
    label: 'Top 5 bills',
    prompt:
      'Show my top 5 highest electricity bills in the last 12 months with site names and bill_ids.'
  },
  {
    label: 'Max LPSC',
    prompt:
      'Where am I paying the most LPSC penalties? List sites with total LPSC in ₹ and bill_ids.'
  },
  {
    label: 'Abnormal bills',
    prompt:
      'Identify abnormal bills in the last 6 months and explain why they are marked abnormal.'
  },
  {
    label: 'Missed rebates',
    prompt: 'Which sites have the highest missed rebate potential in the last 3 cycles?'
  },
  {
    label: 'Portfolio summary',
    prompt: 'Summarise my overall portfolio: total spend, LPSC, PF penalties, and missed rebates.'
  }
];

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  const parts = message.parts ?? [];
  return parts
    .filter((p: { type: string }) => p.type === 'text')
    .map((p: { text?: string }) => p.text ?? '')
    .join('');
}

function MarkdownTableWithExport({
  children,
  ...props
}: ComponentProps<'table'> & { children?: any }) {
  const tableRef = useRef<HTMLTableElement | null>(null);

  const exportTable = () => {
    const table = tableRef.current;
    if (!table) return;

    const theadHeaders = Array.from(table.querySelectorAll('thead th')).map(
      (th) => th.textContent?.trim() || ''
    );

    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));

    let headers = theadHeaders;
    let dataRows = bodyRows;

    // Fallback: if no header, use the first body row as headers.
    if (!headers.length && bodyRows.length > 0) {
      const firstCells = Array.from(bodyRows[0].querySelectorAll('td')).map(
        (td) => td.textContent?.trim() || ''
      );
      headers = firstCells;
      dataRows = bodyRows.slice(1);
    }

    const safeHeaders =
      headers.length > 0 ? headers : ['col1', 'col2', 'col3', 'col4'];

    const json = dataRows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td')).map(
        (td) => td.textContent?.trim() || ''
      );

      const obj: Record<string, string> = {};
      safeHeaders.forEach((h, i) => {
        const key = h || `col${i + 1}`;
        obj[key] = cells[i] ?? '';
      });
      return obj;
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportToExcel({
      json,
      fileName: `ai_bill_analyst_table_${timestamp}`
    });
  };

  return (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <div className="flex items-center justify-end px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px]"
          onClick={exportTable}
        >
          Export
        </Button>
      </div>
      <table
        ref={tableRef}
        className="min-w-full divide-y divide-border text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

const markdownComponents: ComponentProps<typeof ReactMarkdown>['components'] = {
  table: MarkdownTableWithExport,
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/60" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-foreground"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground"
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b last:border-0 even:bg-muted/30" {...props}>
      {children}
    </tr>
  )
};

export default function AIAnalystChat({ orgId, orgName }: AIAnalystChatProps) {
  const [input, setInput] = useState('');
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<Record<string, 'up' | 'down'>>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat/analyst',
        body: { org_id: orgId }
      }),
    [orgId]
  );

  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    transport
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isLoading]);

  const hasMessages = messages.length > 0;
  const showBottomComposer = hasMessages;

  const resetConversation = () => {
    if (isLoading) stop();
    setInput('');
    setFeedbackByMessageId({});
    setFeedbackSubmitting(null);
    setMessages([]);
  };

  const submit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput('');
  };

  const submitFeedback = async (
    messageId: string,
    rating: 'up' | 'down',
    userQuery: string,
    assistantText: string
  ) => {
    if (feedbackSubmitting === messageId) return;
    setFeedbackSubmitting(messageId);
    try {
      const res = await fetch('/api/chat/analyst/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          rating,
          user_query: userQuery || undefined,
          assistant_text: assistantText || undefined
        })
      });
      if (res.ok) {
        setFeedbackByMessageId((prev) => ({ ...prev, [messageId]: rating }));
      }
    } finally {
      setFeedbackSubmitting(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border bg-background">
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-background/60 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI Bill Analyst</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetConversation}
            disabled={isLoading && !hasMessages}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            New conversation
          </Button>
        </div>
        <div
          className={cn(
            'flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-6',
            !hasMessages && 'flex flex-col items-center justify-center'
          )}
        >
          {!hasMessages && (
            <div className="w-full max-w-2xl px-2 sm:px-0">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  AI Bill Analyst
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask about electricity bills for {orgName}. (It will query your live data.)
                </p>
              </div>

              <Card className="mt-4 border bg-muted/20">
                <CardContent className="p-4 sm:p-6">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about bills, LPSC, PF penalties, rebates, or anomalies…"
                    rows={3}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        submit();
                      }
                    }}
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      Press Enter to send, Shift+Enter for a new line.
                    </p>

                    <div className="ml-auto flex items-center gap-2">
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
                        <SendHorizontal className="mr-1.5 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {SUGGESTED_PROMPTS.map(({ label, prompt }) => (
                      <Button
                        key={label}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className="whitespace-normal text-xs"
                        onClick={() => {
                          if (isLoading) return;
                          sendMessage({ text: prompt });
                          setInput('');
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {messages.map((message: any, index: number) => {
            const isStreamingAssistant =
              isLoading &&
              index === messages.length - 1 &&
              message.role === 'assistant';
            const showFeedback =
              message.role === 'assistant' && !isStreamingAssistant;
            const userQuery =
              index > 0 && messages[index - 1]?.role === 'user'
                ? getMessageText(messages[index - 1])
                : '';
            const assistantText = getMessageText(message);
            const currentRating = feedbackByMessageId[message.id];
            const isSubmitting = feedbackSubmitting === message.id;

            return (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'flex w-full',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role !== 'user' && (
                    <div className="mr-2 mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted/60">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm shadow-sm',
                      message.role === 'user'
                        ? 'max-w-[85%] bg-primary text-primary-foreground sm:max-w-xl'
                        : cn(
                            'max-w-full bg-muted text-foreground sm:max-w-3xl',
                            index === messages.length - 1 && 'animate-in fade-in duration-300'
                          )
                    )}
                  >
                    {message.role === 'user'
                      ? renderUserMessage(message)
                      : renderAssistantMessage(message)}
                  </div>
                </div>
                {showFeedback && (
                  <div className="mt-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label="Helpful"
                      disabled={isSubmitting}
                      onClick={() =>
                        submitFeedback(
                          message.id,
                          'up',
                          userQuery,
                          assistantText
                        )
                      }
                      className={cn(
                        'rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50',
                        currentRating === 'up' && 'text-foreground'
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Not helpful"
                      disabled={isSubmitting}
                      onClick={() =>
                        submitFeedback(
                          message.id,
                          'down',
                          userQuery,
                          assistantText
                        )
                      }
                      className={cn(
                        'rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50',
                        currentRating === 'down' && 'text-foreground'
                      )}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
              <span>Analysing your live bill data&hellip;</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {(error as any)?.message ?? 'Something went wrong. Please try again.'}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showBottomComposer && (
          <div className="border-t bg-background px-3 py-3 sm:px-4">
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
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Press Enter to send, Shift+Enter for a new line.
                </p>
                <div className="ml-auto flex items-center gap-2">
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
                    <SendHorizontal className="mr-1.5 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
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

function ToolCallCard({
  input,
  output,
  state,
  errorText
}: {
  input: { sql?: string; reasoning?: string };
  output?: { rows?: unknown; reasoning?: string };
  state: string;
  errorText?: string;
}) {
  const [sqlExpanded, setSqlExpanded] = useState(false);

  const rows = output && Array.isArray(output.rows) ? output.rows : [];
  const rowCount = rows.length;
  const hasError = state === 'output-error';
  const isComplete = state === 'output-available' || state === 'output-error';
  const isEmpty = state === 'output-available' && rowCount === 0;

  let statusColor = 'text-muted-foreground';
  let StatusIcon = Loader2;
  let statusLabel = 'Running query…';

  if (hasError) {
    statusColor = 'text-destructive';
    StatusIcon = XCircle;
    statusLabel = 'Query failed';
  } else if (isEmpty) {
    statusColor = 'text-amber-600 dark:text-amber-400';
    StatusIcon = AlertCircle;
    statusLabel = 'No rows returned';
  } else if (isComplete) {
    statusColor = 'text-emerald-600 dark:text-emerald-400';
    StatusIcon = CheckCircle2;
    statusLabel = `${rowCount} row${rowCount !== 1 ? 's' : ''} fetched`;
  }

  return (
    <div className="rounded-lg border bg-background/80 text-xs">
      <div className="flex items-center gap-2 px-3 py-2">
        <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium text-foreground">Database Query</span>
        <span className="ml-auto flex items-center gap-1.5">
          <StatusIcon
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              statusColor,
              !isComplete && 'animate-spin'
            )}
          />
          <span className={cn('font-medium', statusColor)}>
            {statusLabel}
          </span>
        </span>
      </div>

      {input.reasoning && (
        <div className="border-t px-3 py-2 text-muted-foreground">
          {input.reasoning}
        </div>
      )}

      {input.sql && (
        <div className="border-t">
          <button
            type="button"
            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setSqlExpanded((v) => !v)}
          >
            {sqlExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}
            <span className="font-mono">SQL</span>
          </button>
          {sqlExpanded && (
            <pre className="max-h-48 overflow-auto border-t bg-muted/50 px-3 py-2 text-[11px] leading-relaxed">
              <code>{input.sql}</code>
            </pre>
          )}
        </div>
      )}

      {hasError && errorText && (
        <div className="border-t px-3 py-2 text-destructive">
          {errorText}
        </div>
      )}
    </div>
  );
}

function renderAssistantMessage(message: any) {
  const parts = message.parts ?? [];

  const hasTextContent = parts.some(
    (p: any) => p.type === 'text' && p.text?.trim()
  );
  const toolParts = parts.filter(
    (p: any) => p.type === 'tool-execute_query'
  );
  const allToolsEmpty =
    toolParts.length > 0 &&
    toolParts.every((p: any) => {
      const rows = Array.isArray(p.output?.rows) ? p.output.rows : [];
      return p.state === 'output-available' && rows.length === 0;
    });

  return (
    <div className="space-y-3">
      {parts.map((part: any, index: number) => {
        if (part.type === 'text') {
          if (!part.text?.trim()) return null;
          return (
            <div
              key={index}
              className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:mb-2 prose-p:leading-relaxed prose-ul:mb-2 prose-ol:mb-2 prose-li:my-0.5"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {part.text}
              </ReactMarkdown>
            </div>
          );
        }

        if (part.type === 'tool-execute_query') {
          const rawRows = Array.isArray(part.output?.rows) ? part.output.rows : [];
          const safeRows = rawRows.filter((r: unknown) => r && typeof r === 'object') as Array<
            Record<string, unknown>
          >;
          const showCharts = part.state === 'output-available' && safeRows.length > 0;
          const showDocs = part.state === 'output-available' && safeRows.length > 0;

          return (
            <div key={index} className="space-y-3">
              <ToolCallCard
                input={part.input ?? {}}
                output={part.output}
                state={part.state}
                errorText={part.errorText}
              />
              {showCharts && <QueryChart rows={safeRows} />}
              {showDocs && <BillDocumentLinks rows={safeRows} />}
            </div>
          );
        }

        return null;
      })}

      {!hasTextContent && allToolsEmpty && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          No matching data was found for your query. Try broadening your date range or adjusting the filters.
        </div>
      )}
    </div>
  );
}

