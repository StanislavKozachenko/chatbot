"use client"

import { useRef } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSend: () => void
}

export function MessageInput({
  input,
  isLoading,
  onInputChange,
  onSend,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="flex items-end gap-2 p-4">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        rows={1}
        className="min-h-10 max-h-40 flex-1 resize-none"
        disabled={isLoading}
      />
      <Button
        size="icon"
        disabled={isLoading || !input.trim()}
        onClick={onSend}
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  )
}
