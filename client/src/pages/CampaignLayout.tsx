import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { api, type Campaign } from '../api';

export interface CampaignContext {
  campaign: Campaign;
  refresh: () => void;
}

const tabs = [
  { to: '', icon: '🏰', label: 'Home', end: true },
  { to: 'records', icon: '📇', label: 'Records', end: false },
  { to: 'notes', icon: '📝', label: 'Notes', end: false },
  { to: 'dice', icon: '🎲', label: 'Dice', end: false },
  { to: 'tracker', icon: '⚔️', label: 'Fight', end: false },
];

export default function CampaignLayout() {
  const { cid } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState('');

  const refresh = () => {
    if (!cid) return;
    api.campaign(cid).then(setCampaign).catch((e) => setError(e.message));
  };
  useEffect(refresh, [cid]);

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
        <Link to="/" className="btn btn-block">
          ← All campaigns
        </Link>
      </div>
    );
  }
  if (!campaign) return <div className="page muted">Loading…</div>;

  return (
    <div className="with-nav">
      <Outlet context={{ campaign, refresh } satisfies CampaignContext} />
      <nav className="bottom-nav" aria-label="Campaign sections">
        {tabs.map((t) => (
          <NavLink
            key={t.label}
            to={t.to}
            end={t.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon" aria-hidden>
              {t.icon}
            </span>
            <span className="nav-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
