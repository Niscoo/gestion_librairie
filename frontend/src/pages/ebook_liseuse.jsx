import { useParams, useLocation, useNavigate } from 'react-router-dom';
import EpubReader from '../components/EpubReader';

export default function EbookLiseuseePage() {
  const { bookId } = useParams();
  const { state, search } = useLocation();
  const navigate = useNavigate();

  const bookUrl = state?.bookUrl ?? new URLSearchParams(search).get('url');

  if (!bookUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, background: '#f5f5f5' }}>
        <p style={{ fontSize: 18, color: '#888' }}>Aucun fichier ebook fourni.</p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#007aff', color: '#fff', fontSize: 15, cursor: 'pointer' }}
        >
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <EpubReader bookUrl={bookUrl} bookId={bookId} />
    </div>
  );
}
