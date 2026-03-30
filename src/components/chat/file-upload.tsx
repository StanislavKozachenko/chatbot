"use client"

import { useRef, useState } from "react"
import { FileText, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { ChatFile } from "@/types"

interface FileUploadProps {
  chatId: string
}

export function FileUpload({ chatId }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: files } = useQuery<ChatFile[]>({
    queryKey: ["files", chatId],
    queryFn: async () => {
      const res = await fetch(`/api/files?chatId=${chatId}`)
      if (!res.ok) throw new Error("Failed to fetch files")
      return res.json()
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("chatId", chatId)
    const res = await fetch("/api/files", { method: "POST", body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setUploadError(data.error ?? "Failed to upload file")
    }
    await queryClient.invalidateQueries({ queryKey: ["files", chatId] })
    setUploading(false)
    e.target.value = ""
  }

  const handleDelete = async (id: string) => {
    queryClient.setQueryData<ChatFile[]>(["files", chatId], (prev) =>
      prev ? prev.filter((f) => f.id !== id) : prev
    )
    await fetch(`/api/files/${id}`, { method: "DELETE" })
    queryClient.invalidateQueries({ queryKey: ["files", chatId] })
  }

  return (
    <div className="flex justify-center px-4 pb-2">
      <div className="w-full max-w-6xl">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
        />
        {files && files.length > 0 && (
          <div className="mb-2 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            {files.length === 1 ? "1 document attached" : `${files.length} documents attached`} — ask a question to use it as context
          </p>
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs"
              >
                <FileText className="size-3 shrink-0" />
                <span className="max-w-[140px] truncate">{f.name}</span>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          </div>
        )}
        {uploadError && (
          <p className="mb-1 text-xs text-destructive">{uploadError}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="size-3" />
          {uploading ? "Uploading..." : "Attach document"}
        </Button>
      </div>
    </div>
  )
}
