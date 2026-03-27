"use client"

import { useRef, useState, useEffect } from "react"
import { SendHorizontal, Square, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { MessageAttachment } from "@/types"

interface MessageInputProps {
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSend: (attachments: MessageAttachment[]) => void
  onStop: () => void
}

export function MessageInput({
  input,
  isLoading,
  onInputChange,
  onSend,
  onStop,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  const uploadFile = async (file: File): Promise<MessageAttachment | null> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) return null
    return res.json()
  }

  const handleFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"))
    if (!images.length) return
    setUploading(true)
    const results = await Promise.all(images.map(uploadFile))
    setAttachments((prev) => [...prev, ...(results.filter(Boolean) as MessageAttachment[])])
    setUploading(false)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files)
    if (files.length) handleFiles(files)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files))
    e.target.value = ""
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if ((!input.trim() && !attachments.length) || isLoading || uploading) return
    onSend(attachments)
    setAttachments([])
  }

  const canSend = (!!input.trim() || attachments.length > 0) && !isLoading && !uploading

  return (
    <div className="border-t p-4 flex justify-center">
      <div className="w-full max-w-6xl">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <div key={a.url} className="relative">
              <img
                src={a.url}
                alt={a.name}
                className="h-16 w-16 rounded-md object-cover"
              />
              <button
                onClick={() => setAttachments((prev) => prev.filter((x) => x.url !== a.url))}
                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <ImagePlus className="size-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Message..."
          rows={1}
          className="min-h-10 max-h-40 flex-1 resize-none overflow-y-auto"
          disabled={isLoading}
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          disabled={!canSend && !isLoading}
          onClick={isLoading ? onStop : handleSend}
        >
          {isLoading ? (
            <Square className="size-3 fill-current" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
      </div>
    </div>
  )
}
