import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api';
import type { CampaignContext } from './CampaignLayout';
import Markdown from '../components/Markdown';

export default function NoteEdit() {
  const { nid } = useParams();
  const { campaign, refresh } = useOutletContext<CampaignContext>();
  const isNew = nid === undefined;
  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(!isNew);
  const [loaded, setLoaded] = useState(isNew);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isNew) return;
    api
      .note(nid!)
      .then((n) => {
        setTitle(n.title);
        setSessionDate(n.session_date);
        setContent(n.content);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, [nid, isNew]);

  if (error) return <div className="page error-banner">{error}</div>;
  if (!loaded) return <div className="page muted">Loading…</div>;

  const save = async () => {
    if (!title.trim()) return;
    try {
      const body = { title: title.trim(), content, session_date: sessionDate };
      if (isNew) {
        const n = await api.createNote(campaign.id, body);
        refresh();
        navigate(`../${n.id}`, { replace: true });
      } else {
        await api.updateNote(nid!, body);
        setPreview(true);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async () => {
    if (isNew || !window.confirm(`Delete "${title}"?`)) return;
    await api.deleteNote(nid!);
    refresh();
    navigate('..');
  };

  return (
    <div className="page">
      <header className="page-header">
        <button className="back-link as-button" onClick={() => navigate('..')}>
          ← Notes
        </button>
        <button className="btn" onClick={() => setPreview(!preview)}>
          {preview ? '✏️ Edit' : '👁 Preview'}
        </button>
      </header>

      {preview ? (
        <>
          <h1>{title || 'Untitled'}</h1>
          {sessionDate && <p className="muted">{sessionDate}</p>}
          <div className="card">
            <Markdown text={content || '*Nothing here yet.*'} />
          </div>
        </>
      ) : (
        <div className="form">
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session 3 — Into the Undervault"
            />
          </label>
          <label>
            Session date
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </label>
          <label>
            Notes <span className="muted">(Markdown)</span>
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'## Recap\n\n- What happened\n\n## Next time\n\n- [ ] Prep list'}
            />
          </label>
          <div className="row form-actions">
            {!isNew && (
              <button className="btn btn-danger" onClick={remove}>
                Delete
              </button>
            )}
            <button className="btn btn-primary" onClick={save} disabled={!title.trim()}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
