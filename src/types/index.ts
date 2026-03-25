// Message parts (AI SDK v6 UIMessage format)

export interface TextPart {
  type: "text"
  text: string
}

export interface ImagePart {
  type: "image"
  image: string // URL or base64
}

export type MessagePart = TextPart | ImagePart

export interface MessageAttachment {
  type: "image"
  url: string
  name: string
}

// Database row types

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  questions_used: number
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  user_id: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: "user" | "assistant"
  parts: MessagePart[]
  attachments: MessageAttachment[]
  created_at: string
}

export interface ChatFile {
  id: string
  chat_id: string
  user_id: string
  name: string
  file_type: string
  file_size: number
  storage_path: string
  tokens: number
  created_at: string
}

export interface FileItem {
  id: string
  file_id: string
  chat_id: string
  content: string
  chunk_index: number
  created_at: string
}

export interface MessageFileItem {
  message_id: string
  file_item_id: string
}

// Models

export type ModelId =
  | "google/gemini-2.0-flash-exp"
  | "groq/llama-3.3-70b-versatile"

export interface ModelOption {
  id: ModelId
  name: string
  provider: "google" | "groq"
  supportsVision: boolean
  description: string
}

// API response types

export interface ApiError {
  error: string
  status?: number
}
