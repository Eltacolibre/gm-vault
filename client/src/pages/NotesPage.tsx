import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, type Note } from '../api';
import type { CampaignContext } from './CampaignLayout';

export default function NotesPage() {
  const { campaign } = useOutletContext<CampaignContext>();
  const [notes, setNotes] = useState<Note[] | null>(null);

  useEffect(() => {
    api.notes(campaign.id).then(setNotes).catch(() => setNotes([]));
  }, [campaign.id]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Session notes</h1>
        <Link to="new" className="btn btn-primary">
          + New
        </Link>
      </header>

      {notes === null ? (
        <p className="muted">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="muted">No notes yet. Write your first session recap!</p>
      ) : (
        <div className="list">
          {notes.map((n) => (
            <Link key={n.id} to={String(n.id)} className="card card-link">
              <div className="card-title">{n.title}</div>
              {n.session_date && <div className="card-meta">{n.session_date}</div>}
              <div className="card-sub note-excerpt">
                {n.content.replace(/[#>*`\-\[\]]/g, '').slice(0, 120)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
