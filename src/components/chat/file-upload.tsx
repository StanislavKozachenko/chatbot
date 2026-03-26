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
    const formData = new FormData()
    formData.append("file", file)
    formData.append("chatId", chatId)
    await fetch("/api/files", { method: "POST", body: formData })
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
    <div className="px-4 pb-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={handleFileChange}
      />
      {files && files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
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
  )
}
