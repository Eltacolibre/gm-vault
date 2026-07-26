import { useEffect, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { api, RECORD_TYPES, TYPE_ICONS, TYPE_LABELS, type GRecord } from '../api';
import type { CampaignContext } from './CampaignLayout';

export default function RecordsPage() {
  const { campaign } = useOutletContext<CampaignContext>();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') ?? '';
  const [q, setQ] = useState(params.get('q') ?? '');
  const [records, setRecords] = useState<GRecord[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .records(campaign.id, { type: type || undefined, q: q || undefined })
        .then(setRecords)
        .catch(() => setRecords([]));
    }, 200);
    return () => clearTimeout(t);
  }, [campaign.id, type, q]);

  const setType = (t: string) => {
    const next = new URLSearchParams(params);
    if (t) next.set('type', t);
    else next.delete('type');
    setParams(next, { replace: true });
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Records</h1>
        <Link to={`new${type ? `?type=${type}` : ''}`} className="btn btn-primary">
          + New
        </Link>
      </header>

      <input
        className="search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search names, tags, text…"
        aria-label="Search records"
      />

      <div className="chip-row" role="tablist" aria-label="Record type">
        <button
          className={`chip${type === '' ? ' active' : ''}`}
          onClick={() => setType('')}
          role="tab"
          aria-selected={type === ''}
        >
          All
        </button>
        {RECORD_TYPES.map((t) => (
          <button
            key={t}
            className={`chip${type === t ? ' active' : ''}`}
            onClick={() => setType(t)}
            role="tab"
            aria-selected={type === t}
          >
            {TYPE_ICONS[t]} {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {records === null ? (
        <p className="muted">Loading…</p>
      ) : records.length === 0 ? (
        <p className="muted">No records{q ? ` matching “${q}”` : ''}.</p>
      ) : (
        <div className="list">
          {records.map((r) => (
            <Link key={r.id} to={String(r.id)} className="card card-link">
              <div className="card-title">
                <span aria-hidden>{TYPE_ICONS[r.type]}</span> {r.name}
              </div>
              {r.subtitle && <div className="card-sub">{r.subtitle}</div>}
              {r.tags && (
                <div className="tag-row">
                  {r.tags.split(',').map((t) => (
                    <span key={t} className="tag">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
