import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Formula } from '../api';
import type { CampaignContext } from './CampaignLayout';
import { rollDice, isValidNotation, type RollResult } from '../dice';

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];

interface HistoryEntry extends RollResult {
  at: string;
  label?: string;
}

export default function DicePage() {
  const { campaign } = useOutletContext<CampaignContext>();
  const [formula, setFormula] = useState('1d20');
  const [result, setResult] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<Formula[]>([]);
  const [saveName, setSaveName] = useState('');
  const [savingOpen, setSavingOpen] = useState(false);
  const [error, setError] = useState('');

  const loadSaved = () => api.formulas(campaign.id).then(setSaved).catch(() => {});
  useEffect(() => {
    loadSaved();
  }, [campaign.id]);

  const doRoll = (notation: string, label?: string) => {
    try {
      const r = { ...rollDice(notation), at: new Date().toLocaleTimeString(), label };
      setResult(r);
      setHistory((h) => [r, ...h].slice(0, 20));
      setError('');
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  /** Tap a die: extend the current formula with that die (or bump its count). */
  const addDie = (sides: number) => {
    setError('');
    setFormula((f) => {
      const trimmed = f.trim();
      if (!trimmed) return `1d${sides}`;
      const m = trimmed.match(new RegExp(`^(.*?)(\\d*)d${sides}$`));
      if (m) {
        const count = (m[2] ? parseInt(m[2], 10) : 1) + 1;
        return `${m[1]}${count}d${sides}`;
      }
      return isValidNotation(trimmed) ? `${trimmed}+1d${sides}` : `1d${sides}`;
    });
  };

  const addModifier = (delta: number) => {
    setFormula((f) => {
      const m = f.trim().match(/^(.*?)([+-])(\d+)$/);
      if (m && !m[1].endsWith('d')) {
        const current = (m[2] === '-' ? -1 : 1) * parseInt(m[3], 10) + delta;
        if (current === 0) return m[1].replace(/[+-]$/, '');
        return `${m[1]}${current >= 0 ? '+' : '-'}${Math.abs(current)}`;
      }
      return delta >= 0 ? `${f.trim()}+${delta}` : `${f.trim()}-${Math.abs(delta)}`;
    });
  };

  const saveFormula = async () => {
    if (!saveName.trim() || !isValidNotation(formula)) return;
    await api.createFormula(campaign.id, { name: saveName.trim(), formula: formula.trim() });
    setSaveName('');
    setSavingOpen(false);
    loadSaved();
  };

  return (
    <div className="page">
      <h1>Dice</h1>

      <div className="dice-result" aria-live="polite">
        {result ? (
          <>
            <div className="dice-total">{result.total}</div>
            <div className="dice-breakdown">
              {result.label && <strong>{result.label}: </strong>}
              {result.breakdown}
            </div>
          </>
        ) : (
          <div className="dice-total muted">—</div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="row">
        <input
          className="dice-input"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doRoll(formula)}
          placeholder="2d6+3"
          aria-label="Dice formula"
        />
        <button className="btn btn-icon" onClick={() => setFormula('')} aria-label="Clear formula">
          ✕
        </button>
      </div>

      <div className="dice-grid">
        {QUICK_DICE.map((d) => (
          <button key={d} className="btn die-btn" onClick={() => addDie(d)}>
            d{d}
          </button>
        ))}
        <button className="btn die-btn" onClick={() => addModifier(1)}>
          +1
        </button>
        <button className="btn die-btn" onClick={() => addModifier(-1)}>
          −1
        </button>
      </div>

      <button
        className="btn btn-primary btn-block btn-xl"
        onClick={() => doRoll(formula)}
        disabled={!formula.trim()}
      >
        🎲 Roll {formula.trim() || '…'}
      </button>

      <div className="row">
        <button className="btn btn-block" onClick={() => setSavingOpen(!savingOpen)}>
          ⭐ Save this formula
        </button>
      </div>
      {savingOpen && (
        <div className="row">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveFormula()}
            placeholder="Name (e.g. Fireball)"
            aria-label="Formula name"
          />
          <button className="btn btn-primary" onClick={saveFormula} disabled={!saveName.trim()}>
            Save
          </button>
        </div>
      )}

      {saved.length > 0 && (
        <>
          <h2 className="section-title">Saved rolls</h2>
          <div className="list">
            {saved.map((f) => (
              <div key={f.id} className="row">
                <button className="btn btn-block saved-roll" onClick={() => doRoll(f.formula, f.name)}>
                  <span className="saved-name">{f.name}</span>
                  <span className="saved-formula">{f.formula}</span>
                </button>
                <button
                  className="btn btn-icon"
                  onClick={() => api.deleteFormula(f.id).then(loadSaved)}
                  aria-label={`Delete ${f.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {history.length > 1 && (
        <>
          <h2 className="section-title">History</h2>
          <div className="list history-list">
            {history.slice(1).map((h, i) => (
              <div key={i} className="history-row">
                <span className="history-total">{h.total}</span>
                <span className="history-detail">
                  {h.label ? `${h.label} · ` : ''}
                  {h.notation} · {h.at}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
