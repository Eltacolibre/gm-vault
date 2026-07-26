export const RECORD_TYPES = ['npc', 'location', 'faction', 'item', 'encounter'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const TYPE_LABELS: Record<RecordType, string> = {
  npc: 'NPCs',
  location: 'Places',
  faction: 'Factions',
  item: 'Items',
  encounter: 'Encounters',
};

export const TYPE_ICONS: Record<RecordType, string> = {
  npc: '🧙',
  location: '🏰',
  faction: '🛡️',
  item: '⚙️',
  encounter: '⚔️',
};

export interface Campaign {
  id: number;
  name: string;
  description: string;
  setting: string;
  created_at: string;
  record_count?: number;
  note_count?: number;
  counts?: Record<string, number>;
}

export interface Combatant {
  id: string;
  name: string;
  init: number;
  hp: number;
  maxHp: number;
}

export interface TrackerState {
  round: number;
  turn: number;
  combatants: Combatant[];
}

export interface RecordData {
  stats?: Array<{ label: string; value: string }>;
  combatants?: Combatant[];
  tracker?: TrackerState;
}

export interface GRecord {
  id: number;
  campaign_id: number;
  type: RecordType;
  name: string;
  subtitle: string;
  tags: string;
  description: string;
  data: RecordData;
  updated_at: string;
}

export interface Note {
  id: number;
  campaign_id: number;
  title: string;
  content: string;
  session_date: string;
  created_at: string;
  updated_at: string;
}

export interface Formula {
  id: number;
  campaign_id: number;
  name: string;
  formula: string;
}

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  campaigns: () => j<Campaign[]>('/api/campaigns'),
  campaign: (id: number | string) => j<Campaign>(`/api/campaigns/${id}`),
  createCampaign: (body: { name: string; description?: string; setting?: string }) =>
    j<Campaign>('/api/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  deleteCampaign: (id: number | string) =>
    j<void>(`/api/campaigns/${id}`, { method: 'DELETE' }),

  records: (cid: number | string, opts: { type?: string; q?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.type) params.set('type', opts.type);
    if (opts.q) params.set('q', opts.q);
    const qs = params.toString();
    return j<GRecord[]>(`/api/campaigns/${cid}/records${qs ? `?${qs}` : ''}`);
  },
  record: (id: number | string) => j<GRecord>(`/api/records/${id}`),
  createRecord: (cid: number | string, body: Partial<GRecord>) =>
    j<GRecord>(`/api/campaigns/${cid}/records`, { method: 'POST', body: JSON.stringify(body) }),
  updateRecord: (id: number | string, body: Partial<GRecord>) =>
    j<GRecord>(`/api/records/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRecord: (id: number | string) => j<void>(`/api/records/${id}`, { method: 'DELETE' }),

  notes: (cid: number | string) => j<Note[]>(`/api/campaigns/${cid}/notes`),
  note: (id: number | string) => j<Note>(`/api/notes/${id}`),
  createNote: (cid: number | string, body: Partial<Note>) =>
    j<Note>(`/api/campaigns/${cid}/notes`, { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (id: number | string, body: Partial<Note>) =>
    j<Note>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteNote: (id: number | string) => j<void>(`/api/notes/${id}`, { method: 'DELETE' }),

  formulas: (cid: number | string) => j<Formula[]>(`/api/campaigns/${cid}/formulas`),
  createFormula: (cid: number | string, body: { name: string; formula: string }) =>
    j<Formula>(`/api/campaigns/${cid}/formulas`, { method: 'POST', body: JSON.stringify(body) }),
  deleteFormula: (id: number | string) => j<void>(`/api/formulas/${id}`, { method: 'DELETE' }),

  exportCampaign: (cid: number | string) => j<unknown>(`/api/campaigns/${cid}/export`),
  importCampaign: (payload: unknown) =>
    j<Campaign>('/api/import', { method: 'POST', body: JSON.stringify(payload) }),
};
