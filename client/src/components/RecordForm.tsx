import { useState } from 'react';
import { type GRecord, type RecordData } from '../api';

export interface RecordFormValues {
  name: string;
  subtitle: string;
  tags: string;
  description: string;
  data: RecordData;
}

interface Props {
  initial: Partial<GRecord>;
  onSave: (values: RecordFormValues) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function RecordForm({ initial, onSave, onCancel, saving }: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? '');
  const [tags, setTags] = useState(initial.tags ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [stats, setStats] = useState(initial.data?.stats ?? []);

  const setStat = (i: number, key: 'label' | 'value', v: string) =>
    setStats(stats.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)));

  const save = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      subtitle,
      tags,
      description,
      data: {
        ...initial.data,
        stats: stats.filter((s) => s.label.trim() || s.value.trim()),
      },
    });
  };

  return (
    <div className="form">
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      </label>
      <label>
        Subtitle
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="One-line summary"
        />
      </label>
      <label>
        Tags <span className="muted">(comma-separated)</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ally, act-1" />
      </label>
      <label>
        Description <span className="muted">(Markdown)</span>
        <textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What the GM needs at the table…"
        />
      </label>

      <div className="form-section-title">Quick stats</div>
      {stats.map((s, i) => (
        <div className="row" key={i}>
          <input
            value={s.label}
            onChange={(e) => setStat(i, 'label', e.target.value)}
            placeholder="Label"
            aria-label={`Stat ${i + 1} label`}
          />
          <input
            value={s.value}
            onChange={(e) => setStat(i, 'value', e.target.value)}
            placeholder="Value"
            aria-label={`Stat ${i + 1} value`}
          />
          <button
            className="btn btn-icon"
            onClick={() => setStats(stats.filter((_, idx) => idx !== i))}
            aria-label="Remove stat"
          >
            ✕
          </button>
        </div>
      ))}
      <button className="btn" onClick={() => setStats([...stats, { label: '', value: '' }])}>
        + Add stat
      </button>

      {initial.type === 'encounter' && (
        <p className="muted small">Combatants and HP are managed in the Fight tab.</p>
      )}

      <div className="row form-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save} disabled={!name.trim() || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
