import { useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { api, type Combatant, type GRecord, type TrackerState } from '../api';
import type { CampaignContext } from './CampaignLayout';

const sortByInit = (list: Combatant[]) => [...list].sort((a, b) => b.init - a.init);

const freshTracker = (combatants: Combatant[]): TrackerState => ({
  round: 1,
  turn: 0,
  combatants: sortByInit(combatants.map((c) => ({ ...c }))),
});

export default function TrackerPage() {
  const { campaign } = useOutletContext<CampaignContext>();
  const [params, setParams] = useSearchParams();
  const [encounters, setEncounters] = useState<GRecord[]>([]);
  const [record, setRecord] = useState<GRecord | null>(null);
  const [tracker, setTracker] = useState<TrackerState | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState('');
  const [newHp, setNewHp] = useState('');
  const pending = useRef<{ record: GRecord; tracker: TrackerState } | null>(null);

  const encounterId = params.get('encounter');

  useEffect(() => {
    api
      .records(campaign.id, { type: 'encounter' })
      .then((list) => {
        setEncounters(list);
        if (!encounterId && list.length > 0) {
          setParams({ encounter: String(list[0].id) }, { replace: true });
        }
      })
      .catch(() => {});
  }, [campaign.id]);

  useEffect(() => {
    if (!encounterId) return;
    api
      .record(encounterId)
      .then((r) => {
        setRecord(r);
        setTracker(r.data.tracker ?? freshTracker(r.data.combatants ?? []));
      })
      .catch(() => setRecord(null));
  }, [encounterId]);

  // Persist tracker state into the encounter record, debounced per change.
  useEffect(() => {
    if (!record || !tracker) return;
    pending.current = { record, tracker };
    const t = setTimeout(() => {
      pending.current = null;
      api.updateRecord(record.id, { data: { ...record.data, tracker } }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [record, tracker]);

  // Flush any unsaved change when leaving the page.
  useEffect(
    () => () => {
      const p = pending.current;
      if (p) {
        api.updateRecord(p.record.id, { data: { ...p.record.data, tracker: p.tracker } }).catch(() => {});
      }
    },
    []
  );

  /** All mutations go through functional updates so rapid taps never lose state. */
  const mutate = (fn: (t: TrackerState) => TrackerState) =>
    setTracker((t) => (t ? fn(t) : t));

  if (!encounterId || !record || !tracker) {
    return (
      <div className="page">
        <h1>Encounter tracker</h1>
        {encounters.length === 0 ? (
          <p className="muted">
            No encounters yet. Create one under Records → Encounters, then run it here.
          </p>
        ) : (
          <p className="muted">Loading…</p>
        )}
      </div>
    );
  }

  const active = tracker.combatants[tracker.turn];

  const nextTurn = () =>
    mutate((t) => {
      if (t.combatants.length === 0) return t;
      let turn = t.turn + 1;
      let round = t.round;
      if (turn >= t.combatants.length) {
        turn = 0;
        round += 1;
      }
      return { ...t, turn, round };
    });

  const adjustHp = (id: string, delta: number) =>
    mutate((t) => ({
      ...t,
      combatants: t.combatants.map((c) =>
        c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) } : c
      ),
    }));

  const removeCombatant = (id: string) =>
    mutate((t) => {
      const idx = t.combatants.findIndex((c) => c.id === id);
      const combatants = t.combatants.filter((c) => c.id !== id);
      let turn = t.turn;
      if (idx !== -1 && idx < turn) turn -= 1;
      if (turn >= combatants.length) turn = 0;
      return { ...t, combatants, turn };
    });

  const addCombatant = () => {
    if (!newName.trim()) return;
    const hp = Math.max(1, parseInt(newHp, 10) || 1);
    const added: Combatant = {
      id: `c${Date.now()}`,
      name: newName.trim(),
      init: parseInt(newInit, 10) || 0,
      hp,
      maxHp: hp,
    };
    mutate((t) => {
      const activeId = t.combatants[t.turn]?.id;
      const combatants = sortByInit([...t.combatants, added]);
      const turn = activeId ? Math.max(0, combatants.findIndex((c) => c.id === activeId)) : 0;
      return { ...t, combatants, turn };
    });
    setNewName('');
    setNewInit('');
    setNewHp('');
  };

  const reset = () => {
    if (!window.confirm('Reset the encounter to full HP and round 1?')) return;
    mutate(() => freshTracker(record.data.combatants ?? []));
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Fight</h1>
        <span className="round-badge">Round {tracker.round}</span>
      </header>

      <select
        className="encounter-select"
        value={encounterId}
        onChange={(e) => setParams({ encounter: e.target.value }, { replace: true })}
        aria-label="Choose encounter"
      >
        {encounters.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <button className="btn btn-primary btn-block btn-xl" onClick={nextTurn}>
        ▶ Next turn{active ? ` (now: ${active.name})` : ''}
      </button>

      <div className="list">
        {tracker.combatants.map((c, i) => (
          <div
            key={c.id}
            className={`combatant${i === tracker.turn ? ' active-turn' : ''}${c.hp === 0 ? ' down' : ''}`}
          >
            <div className="combatant-top">
              <span className="combatant-init">{c.init}</span>
              <span className="combatant-name">
                {c.name}
                {c.hp === 0 && ' 💀'}
              </span>
              <button
                className="btn btn-icon"
                onClick={() => removeCombatant(c.id)}
                aria-label={`Remove ${c.name}`}
              >
                ✕
              </button>
            </div>
            <div className="hp-bar">
              <div
                className="hp-fill"
                style={{ width: `${c.maxHp ? (c.hp / c.maxHp) * 100 : 0}%` }}
              />
            </div>
            <div className="combatant-controls">
              <button className="btn hp-btn" onClick={() => adjustHp(c.id, -5)}>
                −5
              </button>
              <button className="btn hp-btn" onClick={() => adjustHp(c.id, -1)}>
                −1
              </button>
              <span className="hp-value">
                {c.hp}/{c.maxHp}
              </span>
              <button className="btn hp-btn" onClick={() => adjustHp(c.id, +1)}>
                +1
              </button>
              <button className="btn hp-btn" onClick={() => adjustHp(c.id, +5)}>
                +5
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-block" onClick={() => setAddOpen(!addOpen)}>
        + Add combatant
      </button>
      {addOpen && (
        <div className="card">
          <div className="form">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              aria-label="Combatant name"
            />
            <div className="row">
              <input
                type="number"
                inputMode="numeric"
                value={newInit}
                onChange={(e) => setNewInit(e.target.value)}
                placeholder="Init"
                aria-label="Initiative"
              />
              <input
                type="number"
                inputMode="numeric"
                value={newHp}
                onChange={(e) => setNewHp(e.target.value)}
                placeholder="HP"
                aria-label="Hit points"
              />
              <button className="btn btn-primary" onClick={addCombatant} disabled={!newName.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="btn btn-danger btn-block" onClick={reset}>
        ↺ Reset encounter
      </button>
    </div>
  );
}
