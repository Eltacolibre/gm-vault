import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, RECORD_TYPES, TYPE_ICONS, TYPE_LABELS, type Note } from '../api';
import type { CampaignContext } from './CampaignLayout';

export default function CampaignHome() {
  const { campaign } = useOutletContext<CampaignContext>();
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    api.notes(campaign.id).then(setNotes).catch(() => {});
  }, [campaign.id]);

  return (
    <div className="page">
      <header className="app-header">
        <Link to="/" className="back-link">
          ← Campaigns
        </Link>
        <h1>{campaign.name}</h1>
        {campaign.setting && <p className="muted">{campaign.setting}</p>}
      </header>

      {campaign.description && <div className="card">{campaign.description}</div>}

      <div className="tile-grid">
        {RECORD_TYPES.map((t) => (
          <Link key={t} to={`records?type=${t}`} className="tile">
            <span className="tile-icon" aria-hidden>
              {TYPE_ICONS[t]}
            </span>
            <span className="tile-count">{campaign.counts?.[t] ?? 0}</span>
            <span className="tile-label">{TYPE_LABELS[t]}</span>
          </Link>
        ))}
        <Link to="notes" className="tile">
          <span className="tile-icon" aria-hidden>
            📝
          </span>
          <span className="tile-count">{campaign.counts?.notes ?? 0}</span>
          <span className="tile-label">Notes</span>
        </Link>
      </div>

      {notes.length > 0 && (
        <>
          <h2 className="section-title">Latest session</h2>
          <Link to={`notes/${notes[0].id}`} className="card card-link">
            <div className="card-title">{notes[0].title}</div>
            {notes[0].session_date && <div className="card-meta">{notes[0].session_date}</div>}
          </Link>
        </>
      )}

      <Link to="data" className="btn btn-block">
        💾 Export / import data
      </Link>
    </div>
  );
}
