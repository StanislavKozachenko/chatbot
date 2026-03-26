import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"

export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "file") {
            return (
              <img
                key={i}
                src={part.url}
                alt={part.filename ?? "attachment"}
                className="mb-2 max-w-full rounded-lg"
              />
            )
          }
          if (part.type === "text") {
            return isUser ? (
              <p key={i} className="whitespace-pre-wrap break-words">
                {part.text}
              </p>
            ) : (
              <ReactMarkdown
                key={i}
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                  code: ({ children }) => <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>,
                  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg bg-black/10 p-3 font-mono text-xs dark:bg-white/10">{children}</pre>,
                }}
              >
                {part.text}
              </ReactMarkdown>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
