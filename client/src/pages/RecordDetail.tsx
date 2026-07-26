import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, TYPE_ICONS, TYPE_LABELS, type GRecord } from '../api';
import type { CampaignContext } from './CampaignLayout';
import Markdown from '../components/Markdown';
import RecordForm, { type RecordFormValues } from '../components/RecordForm';

export default function RecordDetail() {
  const { rid } = useParams();
  const { refresh } = useOutletContext<CampaignContext>();
  const [record, setRecord] = useState<GRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (rid) api.record(rid).then(setRecord).catch((e) => setError(e.message));
  }, [rid]);

  if (error) return <div className="page error-banner">{error}</div>;
  if (!record) return <div className="page muted">Loading…</div>;

  const save = async (values: RecordFormValues) => {
    setSaving(true);
    try {
      setRecord(await api.updateRecord(record.id, values));
      setEditing(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${record.name}"? This cannot be undone.`)) return;
    await api.deleteRecord(record.id);
    refresh();
    navigate('..');
  };

  return (
    <div className="page">
      <header className="page-header">
        <Link to={`..?type=${record.type}`} className="back-link">
          ← {TYPE_LABELS[record.type]}
        </Link>
        {!editing && (
          <button className="btn" onClick={() => setEditing(true)}>
            ✏️ Edit
          </button>
        )}
      </header>

      {editing ? (
        <RecordForm
          initial={record}
          onSave={save}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      ) : (
        <>
          <h1>
            <span aria-hidden>{TYPE_ICONS[record.type]}</span> {record.name}
          </h1>
          {record.subtitle && <p className="muted">{record.subtitle}</p>}
          {record.tags && (
            <div className="tag-row">
              {record.tags.split(',').map((t) => (
                <span key={t} className="tag">
                  {t.trim()}
                </span>
              ))}
            </div>
          )}

          {record.data.stats && record.data.stats.length > 0 && (
            <div className="card stat-card">
              {record.data.stats.map((s, i) => (
                <div className="stat-row" key={i}>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {record.description && (
            <div className="card">
              <Markdown text={record.description} />
            </div>
          )}

          {record.type === 'encounter' && (
            <Link to={`../../tracker?encounter=${record.id}`} className="btn btn-primary btn-block">
              ⚔️ Run this encounter
            </Link>
          )}

          <button className="btn btn-danger btn-block" onClick={remove}>
            🗑️ Delete record
          </button>
        </>
      )}
    </div>
  );
}
