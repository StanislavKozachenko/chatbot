"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2 -mx-4 overflow-hidden">
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-1.5">
        <span className="text-xs text-zinc-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.75rem" }}
        codeTagProps={{ style: { fontFamily: "var(--font-geist-mono, monospace)" } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const fullText = message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n")

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "flex animate-in fade-in slide-in-from-bottom-2 duration-200",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("group relative max-w-[90%] sm:max-w-[75%]")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
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
                    pre({ children }) {
                      const child = children as React.ReactElement<{ className?: string; children?: string }>
                      const className = child?.props?.className ?? ""
                      const match = /language-(\w+)/.exec(className)
                      const code = String(child?.props?.children ?? "").replace(/\n$/, "")
                      if (match) {
                        return <CodeBlock language={match[1]} code={code} />
                      }
                      return <pre className="mb-2 overflow-x-auto rounded-lg bg-black/10 p-3 font-mono text-xs dark:bg-white/10">{children}</pre>
                    },
                    code: ({ children }) => (
                      <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              )
            }
            return null
          })}
        </div>

        {!isUser && fullText && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-6 left-1 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  )
}
