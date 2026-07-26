import express, { type Request, type Response, type NextFunction } from 'express';
import { type DB, RECORD_TYPES, type RecordType } from './db.js';
import { exportCampaign, importCampaign, type CampaignExport } from './transfer.js';

interface RecordRow {
  id: number;
  campaign_id: number;
  type: string;
  name: string;
  subtitle: string;
  tags: string;
  description: string;
  data: string;
  updated_at: string;
}

const parseRecord = (row: RecordRow) => ({ ...row, data: JSON.parse(row.data || '{}') });

const idParam = (req: Request): number => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : -1;
};

export function createApp(db: DB) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const campaignExists = (id: number) =>
    db.prepare('SELECT 1 FROM campaigns WHERE id = ?').get(id) !== undefined;

  // ---------- campaigns ----------

  app.get('/api/campaigns', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT c.*,
           (SELECT COUNT(*) FROM records r WHERE r.campaign_id = c.id) AS record_count,
           (SELECT COUNT(*) FROM notes n WHERE n.campaign_id = c.id)   AS note_count
         FROM campaigns c ORDER BY c.id`
      )
      .all();
    res.json(rows);
  });

  app.post('/api/campaigns', (req, res) => {
    const { name, description = '', setting = '' } = req.body ?? {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const { lastInsertRowid } = db
      .prepare('INSERT INTO campaigns (name, description, setting) VALUES (?, ?, ?)')
      .run(name.trim(), String(description), String(setting));
    const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(lastInsertRowid);
    res.status(201).json(row);
  });

  app.get('/api/campaigns/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(idParam(req)) as
      | Record<string, unknown>
      | undefined;
    if (!row) return res.status(404).json({ error: 'Campaign not found' });
    const counts: Record<string, number> = {};
    for (const t of RECORD_TYPES) {
      counts[t] = (
        db
          .prepare('SELECT COUNT(*) AS n FROM records WHERE campaign_id = ? AND type = ?')
          .get(row.id, t) as { n: number }
      ).n;
    }
    counts.notes = (
      db.prepare('SELECT COUNT(*) AS n FROM notes WHERE campaign_id = ?').get(row.id) as {
        n: number;
      }
    ).n;
    res.json({ ...row, counts });
  });

  app.put('/api/campaigns/:id', (req, res) => {
    const id = idParam(req);
    if (!campaignExists(id)) return res.status(404).json({ error: 'Campaign not found' });
    const { name, description, setting } = req.body ?? {};
    if (name !== undefined && (!name || typeof name !== 'string')) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    db.prepare(
      `UPDATE campaigns SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         setting = COALESCE(?, setting)
       WHERE id = ?`
    ).run(name ?? null, description ?? null, setting ?? null, id);
    res.json(db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id));
  });

  app.delete('/api/campaigns/:id', (req, res) => {
    const info = db.prepare('DELETE FROM campaigns WHERE id = ?').run(idParam(req));
    if (info.changes === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.status(204).end();
  });

  // ---------- records ----------

  app.get('/api/campaigns/:id/records', (req, res) => {
    const id = idParam(req);
    if (!campaignExists(id)) return res.status(404).json({ error: 'Campaign not found' });
    const { type, q } = req.query as { type?: string; q?: string };
    if (type && !RECORD_TYPES.includes(type as RecordType)) {
      return res.status(400).json({ error: `type must be one of: ${RECORD_TYPES.join(', ')}` });
    }
    let sql = 'SELECT * FROM records WHERE campaign_id = ?';
    const args: unknown[] = [id];
    if (type) {
      sql += ' AND type = ?';
      args.push(type);
    }
    if (q) {
      sql += ' AND (name LIKE ? OR subtitle LIKE ? OR tags LIKE ? OR description LIKE ?)';
      const like = `%${q}%`;
      args.push(like, like, like, like);
    }
    sql += ' ORDER BY name COLLATE NOCASE';
    const rows = db.prepare(sql).all(...args) as RecordRow[];
    res.json(rows.map(parseRecord));
  });

  app.post('/api/campaigns/:id/records', (req, res) => {
    const id = idParam(req);
    if (!campaignExists(id)) return res.status(404).json({ error: 'Campaign not found' });
    const { type, name, subtitle = '', tags = '', description = '', data = {} } = req.body ?? {};
    if (!RECORD_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${RECORD_TYPES.join(', ')}` });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO records (campaign_id, type, name, subtitle, tags, description, data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, type, name.trim(), String(subtitle), String(tags), String(description), JSON.stringify(data));
    const row = db.prepare('SELECT * FROM records WHERE id = ?').get(lastInsertRowid) as RecordRow;
    res.status(201).json(parseRecord(row));
  });

  app.get('/api/records/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM records WHERE id = ?').get(idParam(req)) as
      | RecordRow
      | undefined;
    if (!row) return res.status(404).json({ error: 'Record not found' });
    res.json(parseRecord(row));
  });

  app.put('/api/records/:id', (req, res) => {
    const id = idParam(req);
    const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as
      | RecordRow
      | undefined;
    if (!existing) return res.status(404).json({ error: 'Record not found' });
    const { name, subtitle, tags, description, data } = req.body ?? {};
    if (name !== undefined && (!name || typeof name !== 'string')) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    db.prepare(
      `UPDATE records SET
         name = COALESCE(?, name),
         subtitle = COALESCE(?, subtitle),
         tags = COALESCE(?, tags),
         description = COALESCE(?, description),
         data = COALESCE(?, data),
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      name ?? null,
      subtitle ?? null,
      tags ?? null,
      description ?? null,
      data !== undefined ? JSON.stringify(data) : null,
      id
    );
    const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as RecordRow;
    res.json(parseRecord(row));
  });

  app.delete('/api/records/:id', (req, res) => {
    const info = db.prepare('DELETE FROM records WHERE id = ?').run(idParam(req));
    if (info.changes === 0) return res.status(404).json({ error: 'Record not found' });
    res.status(204).end();
  });

  // ---------- notes ----------

  app.get('/api/campaigns/:id/notes', (req, res) => {
    const id = idParam(req);
    if (!campaignExists(id)) return res.status(404).json({ error: 'Campaign not found' });
    const rows = db
      .prepare(
        'SELECT * FROM notes WHERE campaign_id = ? ORDER BY session_date DESC, id DESC'
      )
      .all(id);
    res.json(rows);
  });

  app.post('/api/campaigns/:id/notes', (req, res) => {
    const id = idParam(req);
    if (!campaignExists(id)) return res.status(404).json({ error: 'Campaign not found' });
    const { title, content = '', session_date = '' } = req.body ?? {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }
    const { lastInsertRowid } = db
      .prepare('INSERT INTO notes (campaign_id, title, content, session_date) VALUES (?, ?, ?, ?)')
      .run(id, title.trim(), String(content), String(session_date));
    res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(lastInsertRowid));
  });

  app.get('/api/notes/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(idParam(req));
    if (!row) return res.status(404).json({ error: 'Note not found' });
    res.json(row);
  });

  app.put('/api/notes/:id', (req, res) => {
    const id = idParam(req);
    if (!db.prepare('SELECT 1 FROM notes WHERE id = ?').get(id)) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const { title, content, session_date } = req.body ?? {};
    if (title !== undefined && (!title || typeof title !== 'string')) {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
    db.prepare(
      `UPDATE notes SET
         title = COALESCE(?, title),
         content = COALESCE(?, content),
         session_date = COALESCE(?, session_date),
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(title ?? null, content ?? null, session_date ?? null, id);
    res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
  });

  app.delete('/api/notes/:id', (req, res) => {
    const info = db.prepare('DELETE FROM notes WHERE id = ?').run(idParam(req));
    if (info.changes === 0) return res.status(404).json({ error: 'Note not found' });
    res.status(204).end();
  });

  // ---------- dice formulas ----------

  app.get('/api/campaigns/:id/formulas', (req, res) => {
    const id = idParam(req);
    if (!campaignExists(id)) return res.status(404).json({ error: 'Campaign not found' });
    res.json(db.prepare('SELECT * FROM formulas WHERE campaign_id = ? ORDER BY name COLLATE NOCASE').all(id));
  });

  app.post('/api/campaigns/:id/formulas', (req, res) => {
    const id = idParam(req);
    if (!campaignExists(id)) return res.status(404).json({ error: 'Campaign not found' });
    const { name, formula } = req.body ?? {};
    if (!name || typeof name !== 'string' || !formula || typeof formula !== 'string') {
      return res.status(400).json({ error: 'name and formula are required' });
    }
    const { lastInsertRowid } = db
      .prepare('INSERT INTO formulas (campaign_id, name, formula) VALUES (?, ?, ?)')
      .run(id, name.trim(), formula.trim());
    res.status(201).json(db.prepare('SELECT * FROM formulas WHERE id = ?').get(lastInsertRowid));
  });

  app.delete('/api/formulas/:id', (req, res) => {
    const info = db.prepare('DELETE FROM formulas WHERE id = ?').run(idParam(req));
    if (info.changes === 0) return res.status(404).json({ error: 'Formula not found' });
    res.status(204).end();
  });

  // ---------- export / import ----------

  app.get('/api/campaigns/:id/export', (req, res) => {
    const payload = exportCampaign(db, idParam(req));
    if (!payload) return res.status(404).json({ error: 'Campaign not found' });
    res.json(payload);
  });

  app.post('/api/import', (req, res) => {
    try {
      const campaignId = importCampaign(db, req.body as CampaignExport);
      res.status(201).json(db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid import file' });
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
