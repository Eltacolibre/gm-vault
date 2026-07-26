import { useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../api';
import type { CampaignContext } from './CampaignLayout';

export default function DataPage() {
  const { campaign } = useOutletContext<CampaignContext>();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const doExport = async () => {
    try {
      const payload = await api.exportCampaign(campaign.id);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      a.download = `gm-vault-${slug || 'campaign'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Exported! Check your downloads.');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const doImport = async (file: File) => {
    try {
      const payload = JSON.parse(await file.text());
      const created = await api.importCampaign(payload);
      navigate(`/c/${created.id}`);
    } catch (e) {
      setError(`Import failed: ${(e as Error).message}`);
    }
  };

  const doDelete = async () => {
    const answer = window.prompt(
      `This permanently deletes "${campaign.name}" and everything in it.\n\nType DELETE to confirm:`
    );
    if (answer !== 'DELETE') return;
    await api.deleteCampaign(campaign.id);
    navigate('/');
  };

  return (
    <div className="page">
      <header className="page-header">
        <Link to=".." className="back-link">
          ← {campaign.name}
        </Link>
      </header>
      <h1>Campaign data</h1>
      <p className="muted">
        Everything lives in a local SQLite file — no cloud, no accounts. Use JSON export for
        backups or to move a campaign between devices.
      </p>

      {status && <div className="ok-banner">{status}</div>}
      {error && <div className="error-banner">{error}</div>}

      <button className="btn btn-primary btn-block btn-xl" onClick={doExport}>
        📤 Export campaign as JSON
      </button>

      <button className="btn btn-block btn-xl" onClick={() => fileRef.current?.click()}>
        📥 Import campaign from JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) doImport(f);
          e.target.value = '';
        }}
      />
      <p className="muted small">Importing always creates a new campaign; it never overwrites.</p>

      <h2 className="section-title">Danger zone</h2>
      <button className="btn btn-danger btn-block" onClick={doDelete}>
        🗑️ Delete this campaign
      </button>
    </div>
  );
}
