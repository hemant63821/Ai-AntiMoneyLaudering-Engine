import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { playAlertSound } from '../utils/alertSound'

export interface ScreeningAlert {
  transactionId: string
  customerName: string
  riskLevel: 'high' | 'critical'
  flaggedCountry: string
  listType: 'blacklist' | 'grey-list'
  amount: number
  transactionDate: string
  senderCountry: string
  receiverCountry: string
  reason: string
  jurisdiction: string
  jurisdictionDate: string
  sources: Array<{ title: string; score: number; snippet: string }>
  processingTimeMs: number
}

interface AlertsContextValue {
  alerts: ScreeningAlert[]
  loading: boolean
  error: string | null
  liveCount: number
  refetch: () => void
}

const AlertsContext = createContext<AlertsContextValue>({
  alerts: [],
  loading: true,
  error: null,
  liveCount: 0,
  refetch: () => {},
})

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<ScreeningAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [liveCount, setLiveCount] = useState(0)
  const prevCountRef = useRef<number | null>(null)

  // REST fetch — runs on mount and on explicit refetch
  useEffect(() => {
    setLoading(true)
    fetch('http://localhost:3000/transactions/alerts')
      .then((r) => {
        if (!r.ok) throw new Error(`Server responded with ${r.status}`)
        return r.json() as Promise<ScreeningAlert[]>
      })
      .then((data) => {
        setAlerts(data)
        setLiveCount(data.length)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tick])

  // WebSocket — live count pushed by server on every new alert
  useEffect(() => {
    const socket: Socket = io('http://localhost:3000/alerts', {
      transports: ['websocket'],
    })

    socket.on('alert_count', ({ count }: { count: number }) => {
      if (prevCountRef.current !== null && count > prevCountRef.current) {
        playAlertSound()
      }
      prevCountRef.current = count
      setLiveCount(count)
      // Also refresh the list so the table stays in sync
      setTick((t) => t + 1)
    })

    return () => { socket.disconnect() }
  }, [])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return (
    <AlertsContext.Provider value={{ alerts, loading, error, liveCount, refetch }}>
      {children}
    </AlertsContext.Provider>
  )
}

export const useAlerts = () => useContext(AlertsContext)
