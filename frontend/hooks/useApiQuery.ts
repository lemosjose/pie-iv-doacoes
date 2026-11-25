"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"

import { getApiErrorMessage } from "@/lib/api"
import type { ApiQuery, ApiQueryResult } from "@/types/hooks"

export function useApiQuery<TData>(
  request: (signal: AbortSignal) => Promise<TData>,
  enabled = true
): ApiQuery<TData> {
  const [result, setResult] = useState<ApiQueryResult<TData> | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const controller = new AbortController()

    request(controller.signal)
      .then((data) => {
        setResult({ request, reloadToken, data, error: null })
      })
      .catch((caught: unknown) => {
        if (axios.isCancel(caught)) {
          return
        }
        setResult({
          request,
          reloadToken,
          data: null,
          error: getApiErrorMessage(caught),
        })
      })

    return () => {
      controller.abort()
    }
  }, [request, enabled, reloadToken])

  const isCurrent =
    result !== null &&
    result.request === request &&
    result.reloadToken === reloadToken

  return {
    data: result?.data ?? null,
    error: isCurrent ? result.error : null,
    isLoading: enabled && !isCurrent,
    refetch,
  }
}
