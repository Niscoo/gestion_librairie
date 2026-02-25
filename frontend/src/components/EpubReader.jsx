import { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/EpubReader.css';

const THEMES = {
  light: {
    body: { background: '#ffffff !important', color: '#1a1a1a !important' },
    p: { 'line-height': '1.8 !important' },
  },
  dark: {
    body: { background: '#1c1c1e !important', color: '#e5e5ea !important' },
    p: { 'line-height': '1.8 !important' },
  },
  sepia: {
    body: { background: '#f9f1e4 !important', color: '#4a3728 !important' },
    p: { 'line-height': '1.8 !important' },
  },
};

const HIGHLIGHT_COLORS = {
  yellow: 'rgba(255, 220, 0, 0.45)',
  blue: 'rgba(100, 180, 255, 0.45)',
};

export default function EpubReader({ bookUrl, bookId }) {
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const { user } = useUser();

  // Reader state
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('serif');
  const [progress, setProgress] = useState(0);
  const [locationsReady, setLocationsReady] = useState(false);
  const [chapterLabel, setChapterLabel] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Annotation tooltip
  const [tooltip, setTooltip] = useState({
    visible: false, x: 0, y: 0, cfiRange: '', text: '',
  });

  // Note modal
  const [noteModal, setNoteModal] = useState({
    visible: false, cfiRange: '', text: '', content: '', isPrivate: true,
  });

  const [notes, setNotes] = useState([]);

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bookUrl || !viewerRef.current) return;

    const book = ePub(bookUrl);
    bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated',
    });
    renditionRef.current = rendition;

    // Register all themes
    Object.entries(THEMES).forEach(([name, styles]) => {
      rendition.themes.register(name, styles);
    });
    rendition.themes.select(theme);
    rendition.themes.fontSize(`${fontSize}px`);
    rendition.themes.font(fontFamily);

    rendition.display();

    // TOC
    book.loaded.navigation.then((nav) => {
      setToc(nav.toc || []);
    });

    // Generate locations for progress slider
    book.ready.then(() => {
      book.locations.generate(1024).then(() => setLocationsReady(true));
    });

    // Track location changes
    rendition.on('relocated', (location) => {
      if (book.locations?.total > 0) {
        const pct = book.locations.percentageFromCfi(location.start.cfi);
        setProgress(Math.round((pct || 0) * 100));
      }
      // Update chapter label from TOC
      book.loaded.navigation.then((nav) => {
        const match = nav.toc.find((item) => {
          try {
            return book.spine.get(item.href) === book.spine.get(location.start.href);
          } catch {
            return false;
          }
        });
        if (match) setChapterLabel(match.label?.trim() || '');
      });
    });

    // Text selection → show annotation tooltip
    rendition.on('selected', (cfiRange, contents) => {
      const selection = contents.window.getSelection();
      if (!selection || selection.isCollapsed) return;
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = viewerRef.current.getBoundingClientRect();
        const iframeRect = viewerRef.current.querySelector('iframe')?.getBoundingClientRect();
        const offsetX = iframeRect ? iframeRect.left - containerRect.left : 0;
        const offsetY = iframeRect ? iframeRect.top - containerRect.top : 0;
        setTooltip({
          visible: true,
          x: offsetX + rect.left + rect.width / 2,
          y: offsetY + rect.top - 8,
          cfiRange,
          text: selection.toString(),
        });
      } catch {}
    });

    rendition.on('click', () => {
      setTooltip((t) => ({ ...t, visible: false }));
    });

    return () => {
      book.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookUrl]);

  // ── APPLY APPEARANCE CHANGES ───────────────────────────────────────────────
  useEffect(() => {
    renditionRef.current?.themes.select(theme);
  }, [theme]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    renditionRef.current?.themes.font(fontFamily);
  }, [fontFamily]);

  // ── FETCH SAVED NOTES & RE-APPLY HIGHLIGHTS ────────────────────────────────
  useEffect(() => {
    if (!bookId) return;
    const userId = user?.idUser ?? '';
    fetch(`${API_BASE_URL}/api/notes/${bookId}?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        const fetched = data.notes || [];
        setNotes(fetched);
        if (renditionRef.current) {
          fetched.forEach((n) => {
            if (n.cfi_range) {
              renditionRef.current.annotations.highlight(
                n.cfi_range, {}, null, `hl-${n.id}`,
                { fill: n.color || HIGHLIGHT_COLORS.yellow },
              );
            }
          });
        }
      })
      .catch(() => {});
  }, [bookId, user]);

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  const goNext = () => renditionRef.current?.next();
  const goPrev = () => renditionRef.current?.prev();

  const handleProgressChange = (e) => {
    if (!locationsReady || !bookRef.current) return;
    const pct = parseInt(e.target.value, 10) / 100;
    const cfi = bookRef.current.locations.cfiFromPercentage(pct);
    renditionRef.current?.display(cfi);
  };

  const goToTocItem = (href) => {
    renditionRef.current?.display(href);
    setShowToc(false);
  };

  // ── SEARCH ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !bookRef.current) return;
    setIsSearching(true);
    setSearchResults([]);
    const results = [];
    try {
      await Promise.all(
        bookRef.current.spine.spineItems.map((item) =>
          item.load(bookRef.current.load.bind(bookRef.current))
            .then(() => {
              const found = item.find(searchQuery) || [];
              item.unload();
              results.push(...found);
            })
            .catch(() => {}),
        ),
      );
    } catch {}
    setSearchResults(results.slice(0, 50));
    setIsSearching(false);
  }, [searchQuery]);

  const goToResult = (cfi) => {
    renditionRef.current?.display(cfi);
    setShowSearch(false);
  };

  // ── ANNOTATIONS ──────────────────────────────────────────────────────────
  const handleHighlight = () => {
    if (!tooltip.cfiRange || !renditionRef.current) return;
    renditionRef.current.annotations.highlight(
      tooltip.cfiRange, {}, null, '',
      { fill: HIGHLIGHT_COLORS.yellow },
    );
    saveNote(tooltip.cfiRange, tooltip.text, '', true, HIGHLIGHT_COLORS.yellow);
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const handleAddNote = () => {
    setNoteModal({
      visible: true,
      cfiRange: tooltip.cfiRange,
      text: tooltip.text,
      content: '',
      isPrivate: true,
    });
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const handleSearchWeb = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(tooltip.text)}`, '_blank');
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const saveNote = async (cfiRange, highlightedText, content, isPrivate, color) => {
    if (!bookId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.idUser,
          book_id: bookId,
          cfi_range: cfiRange,
          highlighted_text: highlightedText,
          content,
          is_private: isPrivate,
          color: color || HIGHLIGHT_COLORS.yellow,
        }),
      });
      const data = await res.json();
      if (data.note) setNotes((prev) => [...prev, data.note]);
    } catch {}
  };

  const submitNote = () => {
    if (!noteModal.cfiRange) return;
    renditionRef.current?.annotations.highlight(
      noteModal.cfiRange, {}, null, '',
      { fill: HIGHLIGHT_COLORS.blue },
    );
    saveNote(noteModal.cfiRange, noteModal.text, noteModal.content, noteModal.isPrivate, HIGHLIGHT_COLORS.blue);
    setNoteModal((m) => ({ ...m, visible: false }));
  };

  // Close all dropdowns when clicking outside
  const closeDropdowns = () => {
    setShowToc(false);
    setShowSettings(false);
    setShowSearch(false);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={`epub-reader epub-theme-${theme}`} onClick={closeDropdowns}>

      {/* ── TOP TOOLBAR ── */}
      <div className="epub-toolbar" onClick={(e) => e.stopPropagation()}>
        <div className="epub-toolbar-left">

          {/* TOC */}
          <div className="epub-dropdown-wrap">
            <button
              className="epub-btn"
              onClick={() => { setShowToc((v) => !v); setShowSettings(false); setShowSearch(false); }}
              title="Table des matières"
            >
              ☰
            </button>
            {showToc && (
              <div className="epub-dropdown epub-toc-dropdown">
                <p className="epub-dropdown-title">Table des matières</p>
                <ul>
                  {toc.length === 0 && <li className="epub-no-results">Aucun chapitre trouvé</li>}
                  {toc.map((item, i) => (
                    <li key={i}>
                      <button onClick={() => goToTocItem(item.href)}>
                        {item.label?.trim()}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="epub-dropdown-wrap">
            <button
              className="epub-btn"
              onClick={() => { setShowSearch((v) => !v); setShowToc(false); setShowSettings(false); }}
              title="Rechercher"
            >
              🔍
            </button>
            {showSearch && (
              <div className="epub-dropdown epub-search-dropdown">
                <div className="epub-search-row">
                  <input
                    type="text"
                    className="epub-search-input"
                    placeholder="Rechercher dans le livre…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    autoFocus
                  />
                  <button className="epub-btn-sm" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? '…' : 'OK'}
                  </button>
                </div>
                <ul className="epub-search-results">
                  {searchResults.map((r, i) => (
                    <li key={i}>
                      <button onClick={() => goToResult(r.cfi)}>
                        {r.excerpt?.slice(0, 90)}
                      </button>
                    </li>
                  ))}
                  {!isSearching && searchQuery && searchResults.length === 0 && (
                    <li className="epub-no-results">Aucun résultat</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Chapter label */}
        {chapterLabel && (
          <span className="epub-chapter-label">{chapterLabel}</span>
        )}

        <div className="epub-toolbar-right">
          {/* Notes counter */}
          {notes.length > 0 && (
            <span className="epub-notes-badge" title={`${notes.length} annotation(s)`}>
              📝 {notes.length}
            </span>
          )}

          {/* Settings */}
          <div className="epub-dropdown-wrap">
            <button
              className="epub-btn epub-btn-aa"
              onClick={() => { setShowSettings((v) => !v); setShowToc(false); setShowSearch(false); }}
              title="Apparence"
            >
              Aa
            </button>
            {showSettings && (
              <div className="epub-dropdown epub-settings-dropdown">
                <p className="epub-dropdown-title">Apparence</p>

                <div className="epub-setting-row">
                  <span className="epub-setting-label">Thème</span>
                  <div className="epub-theme-swatches">
                    {[
                      { key: 'light', bg: '#ffffff', color: '#1a1a1a', label: 'Clair' },
                      { key: 'sepia', bg: '#f9f1e4', color: '#4a3728', label: 'Sépia' },
                      { key: 'dark', bg: '#1c1c1e', color: '#e5e5ea', label: 'Sombre' },
                    ].map(({ key, bg, color, label }) => (
                      <button
                        key={key}
                        className={`epub-theme-swatch ${theme === key ? 'active' : ''}`}
                        style={{ background: bg, color }}
                        onClick={() => setTheme(key)}
                        title={label}
                      >
                        A
                      </button>
                    ))}
                  </div>
                </div>

                <div className="epub-setting-row">
                  <span className="epub-setting-label">Taille</span>
                  <div className="epub-font-size-ctrl">
                    <button className="epub-btn-sm" onClick={() => setFontSize((f) => Math.max(10, f - 2))}>A−</button>
                    <span className="epub-font-size-val">{fontSize}px</span>
                    <button className="epub-btn-sm" onClick={() => setFontSize((f) => Math.min(36, f + 2))}>A+</button>
                  </div>
                </div>

                <div className="epub-setting-row">
                  <span className="epub-setting-label">Police</span>
                  <div className="epub-font-family-ctrl">
                    <button
                      className={`epub-font-btn ${fontFamily === 'serif' ? 'active' : ''}`}
                      style={{ fontFamily: 'Georgia, serif' }}
                      onClick={() => setFontFamily('serif')}
                    >
                      Serif
                    </button>
                    <button
                      className={`epub-font-btn ${fontFamily === 'sans-serif' ? 'active' : ''}`}
                      style={{ fontFamily: 'system-ui, sans-serif' }}
                      onClick={() => setFontFamily('sans-serif')}
                    >
                      Sans
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── READER AREA ── */}
      <div className="epub-reader-area">
        <button className="epub-nav-btn epub-nav-prev" onClick={goPrev} title="Page précédente" aria-label="Page précédente">
          ‹
        </button>

        <div className="epub-viewer-wrap">
          <div className="epub-viewer" ref={viewerRef} />

          {/* Annotation tooltip */}
          {tooltip.visible && (
            <div
              className="epub-annotation-tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={handleHighlight}>🖊 Surligner</button>
              <button onClick={handleAddNote}>📝 Note</button>
              <button onClick={handleSearchWeb}>🌐 Chercher</button>
            </div>
          )}
        </div>

        <button className="epub-nav-btn epub-nav-next" onClick={goNext} title="Page suivante" aria-label="Page suivante">
          ›
        </button>
      </div>

      {/* ── FOOTER / PROGRESS ── */}
      <div className="epub-footer">
        <span className="epub-progress-label">{progress}%</span>
        <input
          className="epub-progress-slider"
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={handleProgressChange}
          disabled={!locationsReady}
          title={`Progression : ${progress}%`}
          aria-label="Progression"
        />
        <span className="epub-progress-label">{locationsReady ? '100%' : '…'}</span>
      </div>

      {/* ── NOTE MODAL ── */}
      {noteModal.visible && (
        <div className="epub-modal-backdrop" onClick={() => setNoteModal((m) => ({ ...m, visible: false }))}>
          <div className="epub-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="epub-modal-title">Ajouter une note</h3>
            <blockquote className="epub-modal-excerpt">
              « {noteModal.text.slice(0, 140)}{noteModal.text.length > 140 ? '…' : ''} »
            </blockquote>
            <textarea
              className="epub-modal-textarea"
              placeholder="Votre note…"
              value={noteModal.content}
              onChange={(e) => setNoteModal((m) => ({ ...m, content: e.target.value }))}
              rows={4}
              autoFocus
            />
            <div className="epub-modal-privacy">
              <label className={noteModal.isPrivate ? 'active' : ''}>
                <input
                  type="radio"
                  name="privacy"
                  checked={noteModal.isPrivate}
                  onChange={() => setNoteModal((m) => ({ ...m, isPrivate: true }))}
                />
                🔒 Privée
              </label>
              <label className={!noteModal.isPrivate ? 'active' : ''}>
                <input
                  type="radio"
                  name="privacy"
                  checked={!noteModal.isPrivate}
                  onChange={() => setNoteModal((m) => ({ ...m, isPrivate: false }))}
                />
                🌍 Publique
              </label>
            </div>
            <div className="epub-modal-actions">
              <button className="epub-btn-cancel" onClick={() => setNoteModal((m) => ({ ...m, visible: false }))}>
                Annuler
              </button>
              <button className="epub-btn-save" onClick={submitNote}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
