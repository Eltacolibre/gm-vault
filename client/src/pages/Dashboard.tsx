import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Campaign } from '../api';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const load = () => api.campaigns().then(setCampaigns).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    try {
      const c = await api.createCampaign({ name: newName.trim() });
      navigate(`/c/${c.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const importFile = async (file: File) => {
    try {
      const payload = JSON.parse(await file.text());
      const c = await api.importCampaign(payload);
      navigate(`/c/${c.id}`);
    } catch (e) {
      setError(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="page">
      <header className="app-header">
        <h1>
          <span className="logo">🗝️</span> GM Vault
        </h1>
        <p className="muted">Your table, your data. All local.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {campaigns === null ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="list">
          {campaigns.map((c) => (
            <Link key={c.id} to={`/c/${c.id}`} className="card card-link">
              <div className="card-title">{c.name}</div>
              {c.setting && <div className="card-sub">{c.setting}</div>}
              <div className="card-meta">
                {c.record_count} records · {c.note_count} session notes
              </div>
            </Link>
          ))}
          {campaigns.length === 0 && (
            <p className="muted">No campaigns yet — create one below.</p>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-title">New campaign</div>
        <div className="row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Campaign name"
            aria-label="Campaign name"
          />
          <button className="btn btn-primary" onClick={create} disabled={!newName.trim()}>
            Create
          </button>
        </div>
      </div>

      <button className="btn btn-block" onClick={() => fileRef.current?.click()}>
        📥 Import campaign from JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
