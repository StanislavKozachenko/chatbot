export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Chat {id}
    </div>
  )
}
