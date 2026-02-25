import { useParams, useLocation, useNavigate } from 'react-router-dom';
import EpubReader from '../components/EpubReader';

/**
 * Page liseuse ebook.
 * Route : /liseuse/:bookId
 * Le bookUrl est transmis via router state : navigate('/liseuse/123', { state: { bookUrl: '...' } })
 * ou via le query param ?url=...
 */
export default function EbookLiseuseePage() {
  const { bookId } = useParams();
  const { state, search } = useLocation();
  const navigate = useNavigate();

  // Resolve bookUrl from router state or ?url= query param
  const bookUrl = state?.bookUrl ?? new URLSearchParams(search).get('url');

  if (!bookUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
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

  return <EpubReader bookUrl={bookUrl} bookId={bookId} />;
}
