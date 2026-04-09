import { matchHistory } from '../lib/mockData'

export interface MatchHistoryViewModel {
  id: string
  alias: string
  persona: string
  compatibility: number
  lastSeen: string
  status: string
  highlight: string
  statusTone: 'active' | 'inactive'
}

const activeStatuses = new Set(['仍在联系'])

const mapMatchHistory = (record: (typeof matchHistory)[number]): MatchHistoryViewModel => ({
  ...record,
  statusTone: activeStatuses.has(record.status) ? 'active' : 'inactive',
})

export const getMatchHistoryRecords = (): MatchHistoryViewModel[] => matchHistory.map(mapMatchHistory)
