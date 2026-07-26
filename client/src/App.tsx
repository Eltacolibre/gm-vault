import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CampaignLayout from './pages/CampaignLayout';
import CampaignHome from './pages/CampaignHome';
import RecordsPage from './pages/RecordsPage';
import RecordDetail from './pages/RecordDetail';
import RecordNew from './pages/RecordNew';
import NotesPage from './pages/NotesPage';
import NoteEdit from './pages/NoteEdit';
import DicePage from './pages/DicePage';
import TrackerPage from './pages/TrackerPage';
import DataPage from './pages/DataPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/c/:cid" element={<CampaignLayout />}>
        <Route index element={<CampaignHome />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="records/new" element={<RecordNew />} />
        <Route path="records/:rid" element={<RecordDetail />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="notes/new" element={<NoteEdit />} />
        <Route path="notes/:nid" element={<NoteEdit />} />
        <Route path="dice" element={<DicePage />} />
        <Route path="tracker" element={<TrackerPage />} />
        <Route path="data" element={<DataPage />} />
      </Route>
    </Routes>
  );
}
