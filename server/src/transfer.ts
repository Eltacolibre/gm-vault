import { type DB, RECORD_TYPES } from './db.js';

export const EXPORT_FORMAT = 'gm-vault-campaign';
export const EXPORT_VERSION = 1;

export interface CampaignExport {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt?: string;
  campaign: { name: string; description?: string; setting?: string };
  records?: Array<{
    type: string;
    name: string;
    subtitle?: string;
    tags?: string;
    description?: string;
    data?: unknown;
  }>;
  notes?: Array<{ title: string; content?: string; session_date?: string }>;
  formulas?: Array<{ name: string; formula: string }>;
}

export function exportCampaign(db: DB, campaignId: number): CampaignExport | undefined {
  const campaign = db
    .prepare('SELECT name, description, setting FROM campaigns WHERE id = ?')
    .get(campaignId) as { name: string; description: string; setting: string } | undefined;
  if (!campaign) return undefined;

  const records = db
    .prepare(
      'SELECT type, name, subtitle, tags, description, data FROM records WHERE campaign_id = ? ORDER BY type, name'
    )
    .all(campaignId) as Array<{
    type: string;
    name: string;
    subtitle: string;
    tags: string;
    description: string;
    data: string;
  }>;

  const notes = db
    .prepare(
      'SELECT title, content, session_date FROM notes WHERE campaign_id = ? ORDER BY id'
    )
    .all(campaignId) as Array<{ title: string; content: string; session_date: string }>;

  const formulas = db
    .prepare('SELECT name, formula FROM formulas WHERE campaign_id = ? ORDER BY id')
    .all(campaignId) as Array<{ name: string; formula: string }>;

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    campaign,
    records: records.map((r) => ({ ...r, data: JSON.parse(r.data || '{}') })),
    notes,
    formulas,
  };
}

/** Imports a campaign export payload as a brand-new campaign. Returns the new campaign id. */
export function importCampaign(db: DB, payload: CampaignExport): number {
  if (!payload || payload.format !== EXPORT_FORMAT) {
    throw new Error(`Not a GM Vault export (expected format "${EXPORT_FORMAT}")`);
  }
  if (payload.version !== EXPORT_VERSION) {
    throw new Error(`Unsupported export version ${payload.version}`);
  }
  if (!payload.campaign?.name) {
    throw new Error('Export is missing campaign.name');
  }
  for (const r of payload.records ?? []) {
    if (!RECORD_TYPES.includes(r.type as (typeof RECORD_TYPES)[number])) {
      throw new Error(`Unknown record type "${r.type}"`);
    }
    if (!r.name) throw new Error('Record is missing a name');
  }

  const run = db.transaction((p: CampaignExport) => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO campaigns (name, description, setting) VALUES (?, ?, ?)')
      .run(p.campaign.name, p.campaign.description ?? '', p.campaign.setting ?? '');
    const campaignId = Number(lastInsertRowid);

    const insRecord = db.prepare(
      `INSERT INTO records (campaign_id, type, name, subtitle, tags, description, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of p.records ?? []) {
      insRecord.run(
        campaignId,
        r.type,
        r.name,
        r.subtitle ?? '',
        r.tags ?? '',
        r.description ?? '',
        JSON.stringify(r.data ?? {})
      );
    }

    const insNote = db.prepare(
      'INSERT INTO notes (campaign_id, title, content, session_date) VALUES (?, ?, ?, ?)'
    );
    for (const n of p.notes ?? []) {
      insNote.run(campaignId, n.title, n.content ?? '', n.session_date ?? '');
    }

    const insFormula = db.prepare(
      'INSERT INTO formulas (campaign_id, name, formula) VALUES (?, ?, ?)'
    );
    for (const f of p.formulas ?? []) {
      insFormula.run(campaignId, f.name, f.formula);
    }

    return campaignId;
  });

  return run(payload);
}
