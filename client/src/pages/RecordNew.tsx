import { useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { api, RECORD_TYPES, TYPE_ICONS, TYPE_LABELS, type RecordType } from '../api';
import type { CampaignContext } from './CampaignLayout';
import RecordForm, { type RecordFormValues } from '../components/RecordForm';

export default function RecordNew() {
  const { campaign, refresh } = useOutletContext<CampaignContext>();
  const [params] = useSearchParams();
  const initialType = (params.get('type') ?? 'npc') as RecordType;
  const [type, setType] = useState<RecordType>(
    RECORD_TYPES.includes(initialType) ? initialType : 'npc'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const save = async (values: RecordFormValues) => {
    setSaving(true);
    try {
      const rec = await api.createRecord(campaign.id, { ...values, type });
      refresh();
      navigate(`../${rec.id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1>New record</h1>
      {error && <div className="error-banner">{error}</div>}
      <div className="chip-row">
        {RECORD_TYPES.map((t) => (
          <button
            key={t}
            className={`chip${type === t ? ' active' : ''}`}
            onClick={() => setType(t)}
          >
            {TYPE_ICONS[t]} {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <RecordForm
        initial={{ type }}
        onSave={save}
        onCancel={() => navigate('..')}
        saving={saving}
      />
    </div>
  );
}
