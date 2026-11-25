import type { FormMessageProps } from "@/types/components"

export function FormMessage({ error, success }: FormMessageProps) {
  if (error) {
    return (
      <p role="alert" className="text-xs text-destructive">
        {error}
      </p>
    )
  }

  if (success) {
    return (
      <p role="status" className="text-xs text-muted-foreground">
        {success}
      </p>
    )
  }

  return null
}
