import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { openDb, type DB } from '../src/db.js';
import { createApp } from '../src/app.js';
import { SAMPLE_CAMPAIGN, seedIfEmpty } from '../src/seed.js';

let db: DB;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = openDb(':memory:');
  app = createApp(db);
});

async function makeCampaign(name = 'Test Campaign'): Promise<number> {
  const res = await request(app).post('/api/campaigns').send({ name });
  expect(res.status).toBe(201);
  return res.body.id;
}

describe('campaigns', () => {
  it('creates and lists campaigns with counts', async () => {
    const id = await makeCampaign('Aether Test');
    await request(app)
      .post(`/api/campaigns/${id}/records`)
      .send({ type: 'npc', name: 'Someone' });

    const res = await request(app).get('/api/campaigns');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Aether Test');
    expect(res.body[0].record_count).toBe(1);
    expect(res.body[0].note_count).toBe(0);
  });

  it('rejects a campaign without a name', async () => {
    const res = await request(app).post('/api/campaigns').send({});
    expect(res.status).toBe(400);
  });

  it('returns per-type counts on the detail endpoint', async () => {
    const id = await makeCampaign();
    await request(app).post(`/api/campaigns/${id}/records`).send({ type: 'npc', name: 'A' });
    await request(app).post(`/api/campaigns/${id}/records`).send({ type: 'item', name: 'B' });
    await request(app).post(`/api/campaigns/${id}/notes`).send({ title: 'N' });

    const res = await request(app).get(`/api/campaigns/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.counts).toMatchObject({ npc: 1, item: 1, location: 0, notes: 1 });
  });

  it('updates and deletes a campaign, cascading its children', async () => {
    const id = await makeCampaign();
    const rec = await request(app)
      .post(`/api/campaigns/${id}/records`)
      .send({ type: 'faction', name: 'Doomed' });

    const upd = await request(app).put(`/api/campaigns/${id}`).send({ name: 'Renamed' });
    expect(upd.body.name).toBe('Renamed');

    expect((await request(app).delete(`/api/campaigns/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/campaigns/${id}`)).status).toBe(404);
    expect((await request(app).get(`/api/records/${rec.body.id}`)).status).toBe(404);
  });

  it('404s on a missing campaign', async () => {
    expect((await request(app).get('/api/campaigns/999')).status).toBe(404);
  });
});

describe('records', () => {
  it('performs full CRUD and preserves the data payload', async () => {
    const cid = await makeCampaign();
    const created = await request(app).post(`/api/campaigns/${cid}/records`).send({
      type: 'npc',
      name: 'Tessa',
      subtitle: 'Tinker',
      tags: 'contact',
      data: { stats: [{ label: 'Race', value: 'Gnome' }] },
    });
    expect(created.status).toBe(201);
    expect(created.body.data.stats[0].value).toBe('Gnome');

    const updated = await request(app)
      .put(`/api/records/${created.body.id}`)
      .send({ subtitle: 'Broker', data: { stats: [] } });
    expect(updated.body.subtitle).toBe('Broker');
    expect(updated.body.name).toBe('Tessa');
    expect(updated.body.data.stats).toEqual([]);

    expect((await request(app).delete(`/api/records/${created.body.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/records/${created.body.id}`)).status).toBe(404);
  });

  it('rejects an invalid record type', async () => {
    const cid = await makeCampaign();
    const res = await request(app)
      .post(`/api/campaigns/${cid}/records`)
      .send({ type: 'spaceship', name: 'Nope' });
    expect(res.status).toBe(400);
  });

  it('filters by type and searches across text fields', async () => {
    const cid = await makeCampaign();
    await request(app)
      .post(`/api/campaigns/${cid}/records`)
      .send({ type: 'npc', name: 'Krail Emberjaw', tags: 'foundry' });
    await request(app)
      .post(`/api/campaigns/${cid}/records`)
      .send({ type: 'location', name: 'Emberflow Foundry' });
    await request(app)
      .post(`/api/campaigns/${cid}/records`)
      .send({ type: 'npc', name: 'Ilsa Varn', description: 'Runs the foundry paperwork' });

    const byType = await request(app).get(`/api/campaigns/${cid}/records?type=npc`);
    expect(byType.body.map((r: { name: string }) => r.name)).toEqual([
      'Ilsa Varn',
      'Krail Emberjaw',
    ]);

    const byQuery = await request(app).get(`/api/campaigns/${cid}/records?q=foundry`);
    expect(byQuery.body).toHaveLength(3);

    const combined = await request(app).get(`/api/campaigns/${cid}/records?type=npc&q=ember`);
    expect(combined.body).toHaveLength(1);
    expect(combined.body[0].name).toBe('Krail Emberjaw');
  });
});

describe('notes', () => {
  it('performs full CRUD ordered by session date', async () => {
    const cid = await makeCampaign();
    await request(app)
      .post(`/api/campaigns/${cid}/notes`)
      .send({ title: 'Session 1', session_date: '2026-07-03', content: '# Recap' });
    const second = await request(app)
      .post(`/api/campaigns/${cid}/notes`)
      .send({ title: 'Session 2', session_date: '2026-07-10' });

    const list = await request(app).get(`/api/campaigns/${cid}/notes`);
    expect(list.body.map((n: { title: string }) => n.title)).toEqual(['Session 2', 'Session 1']);

    const upd = await request(app)
      .put(`/api/notes/${second.body.id}`)
      .send({ content: 'Updated recap' });
    expect(upd.body.content).toBe('Updated recap');
    expect(upd.body.title).toBe('Session 2');

    expect((await request(app).delete(`/api/notes/${second.body.id}`)).status).toBe(204);
  });

  it('rejects a note without a title', async () => {
    const cid = await makeCampaign();
    const res = await request(app).post(`/api/campaigns/${cid}/notes`).send({ content: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('dice formulas', () => {
  it('creates, lists, and deletes formulas', async () => {
    const cid = await makeCampaign();
    const created = await request(app)
      .post(`/api/campaigns/${cid}/formulas`)
      .send({ name: 'Fireball', formula: '8d6' });
    expect(created.status).toBe(201);

    const list = await request(app).get(`/api/campaigns/${cid}/formulas`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].formula).toBe('8d6');

    expect((await request(app).delete(`/api/formulas/${created.body.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/campaigns/${cid}/formulas`)).body).toHaveLength(0);
  });
});

describe('export / import', () => {
  it('round-trips a campaign through export and import', async () => {
    seedIfEmpty(db);
    const campaigns = await request(app).get('/api/campaigns');
    const cid = campaigns.body[0].id;

    const exported = await request(app).get(`/api/campaigns/${cid}/export`);
    expect(exported.status).toBe(200);
    expect(exported.body.format).toBe('gm-vault-campaign');
    expect(exported.body.records.length).toBeGreaterThan(0);

    const imported = await request(app).post('/api/import').send(exported.body);
    expect(imported.status).toBe(201);
    expect(imported.body.id).not.toBe(cid);

    const original = await request(app).get(`/api/campaigns/${cid}`);
    const copy = await request(app).get(`/api/campaigns/${imported.body.id}`);
    expect(copy.body.counts).toEqual(original.body.counts);
    expect(copy.body.name).toBe(original.body.name);
  });

  it('rejects an import that is not a GM Vault export', async () => {
    const res = await request(app).post('/api/import').send({ hello: 'world' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/GM Vault export/);
  });

  it('rejects an import containing an unknown record type', async () => {
    const bad = structuredClone(SAMPLE_CAMPAIGN);
    bad.records![0].type = 'starship';
    const res = await request(app).post('/api/import').send(bad);
    expect(res.status).toBe(400);
  });
});

describe('sample seed', () => {
  it('seeds once and only when empty', () => {
    expect(seedIfEmpty(db)).toBe(true);
    expect(seedIfEmpty(db)).toBe(false);
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM campaigns').get() as { n: number };
    expect(n).toBe(1);
  });

  it('ships all five record types plus notes and formulas', async () => {
    seedIfEmpty(db);
    const campaigns = await request(app).get('/api/campaigns');
    const detail = await request(app).get(`/api/campaigns/${campaigns.body[0].id}`);
    const counts = detail.body.counts;
    for (const t of ['npc', 'location', 'faction', 'item', 'encounter']) {
      expect(counts[t]).toBeGreaterThan(0);
    }
    expect(counts.notes).toBeGreaterThan(0);
  });
});
