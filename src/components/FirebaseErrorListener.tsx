"use client"
import { useEffect } from "react"
import { errorEmitter } from "@/firebase/error-emitter"
import { useToast } from "@/hooks/use-toast"

export function FirebaseErrorListener() {
  const { toast } = useToast()

  useEffect(() => {
    const handleError = (error: any) => {
      console.error("Caught a Firebase error:", error)
      toast({
        variant: "destructive",
        title: "Firebase Permission Error",
        description: error.message || "Missing or insufficient permissions.",
      })
    }

    errorEmitter.on("permission-error", handleError)

    return () => {
      errorEmitter.off("permission-error", handleError)
    }
  }, [toast])

  return null
}
