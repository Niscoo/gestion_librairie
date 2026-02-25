import { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/EpubReader.css';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

// Pure CSS strings injected directly into iframe <head> — far more reliable
// than epubjs theme objects because they survive epub's own stylesheets.
const THEME_CSS_MAP = {
  light:    `html,body{background:#ffffff!important;color:#1a1a1a!important}body{line-height:1.8!important}`,
  sepia:    `html,body{background:#f9f1e4!important;color:#4a3728!important}body{line-height:1.8!important}`,
  dark:     `html,body{background:#1c1c1e!important;color:#e5e5ea!important}body{line-height:1.8!important}`,
  midnight: `html,body{background:#000000!important;color:#e8e8e8!important}body{line-height:1.8!important}`,
};

// Also register with epubjs so it tracks the "active" theme internally
const THEMES_OBJ = {
  light:    { body: { background: '#ffffff !important', color: '#1a1a1a !important', 'line-height': '1.8 !important' } },
  sepia:    { body: { background: '#f9f1e4 !important', color: '#4a3728 !important', 'line-height': '1.8 !important' } },
  dark:     { body: { background: '#1c1c1e !important', color: '#e5e5ea !important', 'line-height': '1.8 !important' } },
  midnight: { body: { background: '#000000 !important', color: '#e8e8e8 !important', 'line-height': '1.8 !important' } },
};

const THEME_META = [
  { key: 'light',    bg: '#ffffff', color: '#1a1a1a', label: 'Clair'   },
  { key: 'sepia',    bg: '#f9f1e4', color: '#4a3728', label: 'Sépia'   },
  { key: 'dark',     bg: '#1c1c1e', color: '#e5e5ea', label: 'Sombre'  },
  { key: 'midnight', bg: '#000000', color: '#e8e8e8', label: 'Minuit'  },
];

const HIGHLIGHT_PALETTE = [
  { id: 'red',    label: 'Rouge',  color: 'rgba(255, 107, 107, 0.50)' },
  { id: 'orange', label: 'Orange', color: 'rgba(255, 165, 60,  0.50)' },
  { id: 'yellow', label: 'Jaune',  color: 'rgba(255, 214, 10,  0.50)' },
  { id: 'green',  label: 'Vert',   color: 'rgba(72,  199, 116, 0.50)' },
  { id: 'blue',   label: 'Bleu',   color: 'rgba(74,  144, 226, 0.50)' },
  { id: 'purple', label: 'Violet', color: 'rgba(162, 95,  220, 0.50)' },
  { id: 'pink',   label: 'Rose',   color: 'rgba(255, 105, 180, 0.50)' },
  { id: 'gray',   label: 'Gris',   color: 'rgba(150, 150, 150, 0.50)' },
];

const LAYOUT_OPTIONS = [
  { key: 'paginated', label: 'Page',   icon: '□' },
  { key: 'spread',    label: 'Double', icon: '⧉' },
  { key: 'scroll',    label: 'Défile', icon: '≡' },
];

// FIX #3 — 'scroll' uses manager:'continuous' so chapter breaks are seamless
const LAYOUT_CONFIGS = {
  paginated: { flow: 'paginated',           spread: 'none',   manager: 'default'    },
  spread:    { flow: 'paginated',           spread: 'always', manager: 'default'    },
  scroll:    { flow: 'scrolled-continuous', spread: 'none',   manager: 'continuous' },
};

// ── HELPERS (pure — no React state) ──────────────────────────────────────────

/**
 * FIX #2 — Inject a <style data-epub-theme> directly into an iframe document.
 * Removes any previous injection first to prevent style overlap.
 */
function injectThemeCSSToDoc(doc, themeName) {
  if (!doc?.head) return;
  // Clean up previous injection
  doc.querySelectorAll('style[data-epub-theme]').forEach((el) => el.remove());
  const style = doc.createElement('style');
  style.setAttribute('data-epub-theme', '1');
  style.textContent = THEME_CSS_MAP[themeName] || THEME_CSS_MAP.light;
  doc.head.appendChild(style);
}

/** Apply current theme to all currently loaded epub contents. */
function applyThemeToAllContents(rendition, themeName) {
  rendition?.getContents?.()?.forEach((contents) => {
    injectThemeCSSToDoc(contents?.document, themeName);
  });
}

/**
 * Match a TOC entry to a spine href.
 * Compares spine item *index* (not object reference) and strips URL fragments.
 * Returns the label string or '' if not found.
 */
function matchTocLabel(toc, currentHref, book) {
  if (!currentHref || !toc?.length) return '';
  // Normalize: strip fragment (#section-1) and leading slashes
  const normalize = (href) => (href || '').split('#')[0].replace(/^\//, '');
  const currentNorm = normalize(currentHref);

  // Try exact filename match first
  let match = toc.find((item) => normalize(item.href) === currentNorm);

  // Fallback: compare via spine index
  if (!match) {
    try {
      const currentItem = book.spine.get(currentHref);
      if (currentItem) {
        match = toc.find((item) => {
          try {
            const tocItem = book.spine.get(item.href);
            return tocItem && tocItem.index === currentItem.index;
          } catch { return false; }
        });
      }
    } catch {}
  }

  return match?.label?.trim() || '';
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function EpubReader({ bookUrl, bookId }) {
  // DOM refs
  const containerRef  = useRef(null); // .epub-reader root
  const viewerRef     = useRef(null); // .epub-viewer (iframe container)
  const viewerWrapRef = useRef(null); // .epub-viewer-wrap (FIX #1 — anchor for tooltip)

  // epubjs refs — persisted across renders, never trigger re-renders
  const bookRef       = useRef(null);
  const renditionRef  = useRef(null);
  const savedCfiRef   = useRef(null); // last known CFI — used when recreating rendition

  // Appearance refs so layout effect can read current values without stale closures
  const themeRef      = useRef('light');
  const fontSizeRef   = useRef(26);
  const fontFamilyRef = useRef('serif');

  const { user } = useUser();

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [isLoading,      setIsLoading]      = useState(true);
  const [toc,            setToc]            = useState([]);
  const [notes,          setNotes]          = useState([]);
  const [chapterLabel,   setChapterLabel]   = useState('');

  // FIX #4 — page counter state
  const [progress,       setProgress]       = useState(0);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [totalPages,     setTotalPages]     = useState(0);
  const [locationsReady, setLocationsReady] = useState(false);

  // Panels
  const [showToc,      setShowToc]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);

  // Appearance
  const [theme,      setTheme]      = useState('light');
  const [fontSize,   setFontSize]   = useState(26);
  const [fontFamily, setFontFamily] = useState('serif');

  // Layout
  const [layoutMode,   setLayoutMode]   = useState('paginated');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flipAnim,     setFlipAnim]     = useState(null);

  // Search
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching,   setIsSearching]   = useState(false);

  // FIX #1 — tooltip state (position relative to viewerWrap)
  const [tooltip, setTooltip] = useState({
    visible: false, x: 0, y: 0, cfiRange: '', text: '',
  });

  const [noteModal, setNoteModal] = useState({
    visible: false, cfiRange: '', text: '', content: '', isPrivate: true,
  });

  // ── EFFECT 1 — Book lifecycle (only recreate when bookUrl changes) ─────────
  useEffect(() => {
    if (!bookUrl) return;

    setIsLoading(true);
    setLocationsReady(false);
    setTotalPages(0);
    setProgress(0);
    setCurrentPage(1);
    setToc([]);

    const book = ePub(bookUrl);
    bookRef.current = book;

    book.loaded.navigation.then((nav) => setToc(nav.toc || []));

    // FIX #4 — generate locations after book is ready; 1600 chars ≈ 1 page
    book.ready.then(() => {
      book.locations.generate(1600).then(() => {
        setLocationsReady(true);
        setTotalPages(book.locations.total);
        // Backfill page counter if rendition already relocated
        if (savedCfiRef.current && book.locations.total > 0) {
          const pct = book.locations.percentageFromCfi(savedCfiRef.current) ?? 0;
          setProgress(Math.round(pct * 100));
          setCurrentPage(Math.max(1, Math.round(pct * book.locations.total)));
        }
      });
    });

    return () => {
      book.destroy();
      bookRef.current  = null;
      savedCfiRef.current = null;
    };
  }, [bookUrl]);

  // ── EFFECT 2 — Rendition lifecycle (recreate on bookUrl OR layoutMode change)
  useEffect(() => {
    const book = bookRef.current;
    if (!book || !viewerRef.current) return;

    // Tear down previous rendition cleanly
    if (renditionRef.current) {
      renditionRef.current.destroy();
      renditionRef.current = null;
    }
    if (viewerRef.current) viewerRef.current.innerHTML = '';

    const rendition = book.renderTo(viewerRef.current, {
      width:  '100%',
      height: '100%',
      ...LAYOUT_CONFIGS[layoutMode],
    });
    renditionRef.current = rendition;

    // Register named themes with epubjs (for internal tracking)
    Object.entries(THEMES_OBJ).forEach(([name, styles]) =>
      rendition.themes.register(name, styles),
    );
    rendition.themes.select(themeRef.current);
    rendition.themes.fontSize(`${fontSizeRef.current}px`);
    rendition.themes.font(fontFamilyRef.current);

    // FIX #2 — After every chapter renders, re-inject theme CSS.
    // Also use 'rendered' for scroll-mode chapter detection (fires per-section).
    rendition.on('rendered', (section) => {
      applyThemeToAllContents(renditionRef.current, themeRef.current);

      // In scroll mode relocated fires infrequently; update chapter from rendered section
      if (section?.href) {
        book.loaded.navigation.then((nav) => {
          const label = matchTocLabel(nav.toc, section.href, book);
          if (label) setChapterLabel(label);
        });
      }
    });

    // Restore saved position or start from beginning
    rendition.display(savedCfiRef.current || undefined).then(() => setIsLoading(false));

    // FIX #4 — relocated listener: always use bookRef.current (not captured book)
    // to guarantee we have the latest instance after async location generation.
    rendition.on('relocated', (location) => {
      savedCfiRef.current = location.start.cfi;
      setFlipAnim(null);
      setIsLoading(false);

      const currentBook = bookRef.current;

      if (currentBook?.locations?.total > 0) {
        // Accurate CFI-based progress once locations are generated
        const pct = currentBook.locations.percentageFromCfi(location.start.cfi) ?? 0;
        setProgress(Math.round(pct * 100));
        setCurrentPage(Math.max(1, Math.round(pct * currentBook.locations.total)));
      } else {
        // Immediate spine-index-based fallback so slider moves right away
        const spineItems = currentBook?.spine?.spineItems ?? [];
        const currentItem = currentBook?.spine?.get(location.start.href);
        if (spineItems.length > 0 && currentItem) {
          const spinePct = currentItem.index / Math.max(spineItems.length - 1, 1);
          setProgress(Math.round(spinePct * 100));
        }
      }

      // Update chapter label (paginated mode — scroll mode uses 'rendered' above)
      book.loaded.navigation.then((nav) => {
        const label = matchTocLabel(nav.toc, location.start.href, book);
        if (label) setChapterLabel(label);
      });
    });

    // FIX #1 — Stable tooltip position using viewerWrapRef as the coordinate origin.
    // We find the exact iframe that contains the selection by matching contentDocument.
    rendition.on('selected', (cfiRange, contents) => {
      const selection = contents.window.getSelection();
      if (!selection || selection.isCollapsed) return;

      try {
        const range      = selection.getRangeAt(0);
        const rangeBounds = range.getBoundingClientRect();
        if (!rangeBounds.width && !rangeBounds.height) return;

        // Locate the specific iframe hosting this content
        const iframes = viewerRef.current?.querySelectorAll('iframe') ?? [];
        let matchIframe = null;
        for (const iframe of iframes) {
          if (iframe.contentDocument === contents.document) {
            matchIframe = iframe;
            break;
          }
        }
        if (!matchIframe) return;

        const iframeRect  = matchIframe.getBoundingClientRect();
        const wrapRect    = viewerWrapRef.current?.getBoundingClientRect() ?? iframeRect;

        // Position relative to .epub-viewer-wrap (which is position:relative)
        const x = (iframeRect.left - wrapRect.left) + rangeBounds.left + rangeBounds.width / 2;
        const y = (iframeRect.top  - wrapRect.top)  + rangeBounds.top;

        setTooltip({ visible: true, x, y, cfiRange, text: selection.toString() });
      } catch {}
    });

    rendition.on('click', () => setTooltip((t) => ({ ...t, visible: false })));

    return () => {
      rendition.destroy();
      renditionRef.current = null;
      if (viewerRef.current) viewerRef.current.innerHTML = '';
    };
  }, [bookUrl, layoutMode]);

  // ── APPEARANCE EFFECTS — update existing rendition, no re-creation ─────────

  // FIX #2 — theme: call both epubjs select() AND direct CSS injection
  useEffect(() => {
    themeRef.current = theme;
    if (renditionRef.current) {
      renditionRef.current.themes.select(theme);
      applyThemeToAllContents(renditionRef.current, theme);
    }
  }, [theme]);

  useEffect(() => {
    fontSizeRef.current = fontSize;
    renditionRef.current?.themes.fontSize(`${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    fontFamilyRef.current = fontFamily;
    renditionRef.current?.themes.font(fontFamily);
  }, [fontFamily]);

  // ── TOOLTIP PERSISTENCE — Escape key ──────────────────────────────────────
  useEffect(() => {
    if (!tooltip.visible) return;
    const onKey = (e) => { if (e.key === 'Escape') setTooltip((t) => ({ ...t, visible: false })); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tooltip.visible]);

  // ── FULLSCREEN sync ────────────────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── FETCH SAVED NOTES ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!bookId) return;
    fetch(`${API_BASE_URL}/api/notes/${bookId}?user_id=${user?.idUser ?? ''}`)
      .then((r) => r.json())
      .then((data) => {
        const fetched = data.notes || [];
        setNotes(fetched);
        fetched.forEach((n) => {
          if (n.cfi_range) {
            renditionRef.current?.annotations.highlight(
              n.cfi_range, {}, null, `hl-${n.id}`, { fill: n.color || HIGHLIGHT_PALETTE[2].color },
            );
          }
        });
      })
      .catch(() => {});
  }, [bookId, user]);

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  const goNext = useCallback(async () => {
    if (!renditionRef.current) return;
    setFlipAnim('forward');
    await renditionRef.current.next();
  }, []);

  const goPrev = useCallback(async () => {
    if (!renditionRef.current) return;
    setFlipAnim('backward');
    await renditionRef.current.prev();
  }, []);

  const handleProgressChange = (e) => {
    const val = parseInt(e.target.value, 10);
    const book = bookRef.current;
    if (!book) return;

    if (locationsReady && book.locations?.total > 0) {
      // Accurate: jump to CFI location
      const cfi = book.locations.cfiFromPercentage(val / 100);
      renditionRef.current?.display(cfi);
    } else {
      // Fallback: jump by spine index
      const items = book.spine.spineItems;
      if (!items?.length) return;
      const idx = Math.round((val / 100) * (items.length - 1));
      const item = items[Math.min(idx, items.length - 1)];
      if (item) renditionRef.current?.display(item.href);
    }
  };

  const goToTocItem = (href) => {
    renditionRef.current?.display(href);
    setShowToc(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  // ── SEARCH ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || !bookRef.current) return;

    setIsSearching(true);
    setSearchResults([]);

    const book    = bookRef.current;
    const request = book.load.bind(book);
    const results = [];

    try {
      // Ensure spine is fully parsed first
      await book.ready;

      // Iterate spine items sequentially — avoids memory spikes from Promise.all
      for (const item of book.spine.spineItems) {
        try {
          await item.load(request);
          // .search() uses TreeWalker (handles multi-word); fall back to .find()
          const found = (typeof item.search === 'function' ? item.search(query) : item.find(query)) || [];
          results.push(...found);
          item.unload();
        } catch { /* skip unreadable chapter */ }
        if (results.length >= 50) break;
      }
    } catch {}

    setSearchResults(results.slice(0, 50));
    setIsSearching(false);
  }, [searchQuery]);

  // ── ANNOTATIONS ──────────────────────────────────────────────────────────
  const applyHighlight = (color) => {
    if (!tooltip.cfiRange || !renditionRef.current) return;
    renditionRef.current.annotations.highlight(tooltip.cfiRange, {}, null, '', { fill: color });
    saveNote(tooltip.cfiRange, tooltip.text, '', true, color);
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const handleCopy = () => {
    if (tooltip.text) navigator.clipboard.writeText(tooltip.text).catch(() => {});
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const handleSearchWeb = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(tooltip.text)}`, '_blank');
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const handleAddNote = () => {
    setNoteModal({ visible: true, cfiRange: tooltip.cfiRange, text: tooltip.text, content: '', isPrivate: true });
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const submitNote = () => {
    if (!noteModal.cfiRange) return;
    const color = HIGHLIGHT_PALETTE[4].color;
    renditionRef.current?.annotations.highlight(noteModal.cfiRange, {}, null, '', { fill: color });
    saveNote(noteModal.cfiRange, noteModal.text, noteModal.content, noteModal.isPrivate, color);
    setNoteModal((m) => ({ ...m, visible: false }));
  };

  const saveNote = async (cfiRange, highlightedText, content, isPrivate, color) => {
    if (!bookId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.idUser, book_id: bookId, cfi_range: cfiRange,
          highlighted_text: highlightedText, content, is_private: isPrivate, color,
        }),
      });
      const data = await res.json();
      if (data.note) setNotes((prev) => [...prev, data.note]);
    } catch {}
  };

  const closeAllPanels = () => { setShowToc(false); setShowSettings(false); setShowSearch(false); };

  // ── KEYBOARD NAVIGATION ───────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't intercept when typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`epub-reader epub-theme-${theme} epub-layout-${layoutMode} ${isFullscreen ? 'epub-fullscreen' : ''}`}
      onClick={closeAllPanels}
    >
      {/* ── TOOLBAR ── */}
      <div className="epub-toolbar-zone">
      <div className="epub-toolbar" onClick={(e) => e.stopPropagation()}>
        <div className="epub-toolbar-left">

          {/* TOC */}
          <div className="epub-dropdown-wrap">
            <button className="epub-btn" title="Table des matières"
              onClick={() => { setShowToc((v) => !v); setShowSettings(false); setShowSearch(false); }}>☰</button>
            {showToc && (
              <div className="epub-dropdown epub-toc-dropdown">
                <p className="epub-dropdown-title">Table des matières</p>
                <ul>
                  {toc.length === 0 && <li className="epub-no-results">Aucun chapitre</li>}
                  {toc.map((item, i) => (
                    <li key={i}><button onClick={() => goToTocItem(item.href)}>{item.label?.trim()}</button></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="epub-dropdown-wrap">
            <button className="epub-btn" title="Rechercher"
              onClick={() => { setShowSearch((v) => !v); setShowToc(false); setShowSettings(false); }}>🔍</button>
            {showSearch && (
              <div className="epub-dropdown epub-search-dropdown">
                <div className="epub-search-row">
                  <input className="epub-search-input" type="text" placeholder="Rechercher…"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus />
                  <button className="epub-btn-sm" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? '…' : 'OK'}
                  </button>
                </div>
                <ul className="epub-search-results">
                  {searchResults.map((r, i) => (
                    <li key={i}>
                      <button onClick={() => { renditionRef.current?.display(r.cfi); setShowSearch(false); }}>
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

          {/* Layout mode selector */}
          <div className="epub-layout-group">
            {LAYOUT_OPTIONS.map(({ key, label, icon }) => (
              <button key={key}
                className={`epub-layout-btn ${layoutMode === key ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setLayoutMode(key); }} title={label}>
                <span className="epub-layout-icon">{icon}</span>
                <span className="epub-layout-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {chapterLabel && <span className="epub-chapter-label" title={chapterLabel}>{chapterLabel}</span>}

        <div className="epub-toolbar-right">
          {notes.length > 0 && (
            <span className="epub-notes-badge" title={`${notes.length} annotation(s)`}>📝 {notes.length}</span>
          )}

          {/* Settings */}
          <div className="epub-dropdown-wrap">
            <button className="epub-btn epub-btn-aa" title="Apparence"
              onClick={() => { setShowSettings((v) => !v); setShowToc(false); setShowSearch(false); }}>Aa</button>
            {showSettings && (
              <div className="epub-dropdown epub-settings-dropdown">
                <p className="epub-dropdown-title">Apparence</p>
                <div className="epub-setting-row">
                  <span className="epub-setting-label">Thème</span>
                  <div className="epub-theme-swatches">
                    {THEME_META.map(({ key, bg, color, label }) => (
                      <button key={key} className={`epub-theme-swatch ${theme === key ? 'active' : ''}`}
                        style={{ background: bg, color }} onClick={() => setTheme(key)} title={label}>A</button>
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
                    <button className={`epub-font-btn ${fontFamily === 'serif' ? 'active' : ''}`}
                      style={{ fontFamily: 'Georgia, serif' }} onClick={() => setFontFamily('serif')}>Serif</button>
                    <button className={`epub-font-btn ${fontFamily === 'sans-serif' ? 'active' : ''}`}
                      style={{ fontFamily: 'system-ui, sans-serif' }} onClick={() => setFontFamily('sans-serif')}>Sans</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button className="epub-btn" title={isFullscreen ? 'Quitter' : 'Plein écran'}
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}>
            {isFullscreen ? '⊠' : '⛶'}
          </button>
        </div>
      </div>{/* end epub-toolbar */}
      </div>{/* end epub-toolbar-zone */}

      {/* ── READER AREA ── */}
      <div className="epub-reader-area">
        {layoutMode !== 'scroll' && (
          <button className="epub-nav-btn epub-nav-prev" onClick={goPrev} aria-label="Page précédente">‹</button>
        )}

        {/* FIX #1 — viewerWrapRef is the coordinate origin for the tooltip */}
        <div className="epub-viewer-wrap" ref={viewerWrapRef} data-flip={flipAnim || ''}>
          {isLoading && (
            <div className="epub-loader"><div className="epub-spinner" /></div>
          )}
          <div className="epub-viewer" ref={viewerRef} />

          {/* Annotation tooltip — appended to viewerWrap (not the iframe) */}
          {tooltip.visible && (
            <div
              className="epub-annotation-tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="epub-tooltip-colors">
                {HIGHLIGHT_PALETTE.map(({ id, label, color }) => (
                  <button key={id} className="epub-color-dot"
                    style={{ background: color.replace('0.50', '0.85') }}
                    title={label} onClick={() => applyHighlight(color)} />
                ))}
              </div>
              <div className="epub-tooltip-actions">
                <button onClick={handleAddNote}>📝 Note</button>
                <button onClick={handleSearchWeb}>🌐 Web</button>
                <button onClick={handleCopy}>📋 Copier</button>
              </div>
            </div>
          )}
        </div>

        {layoutMode !== 'scroll' && (
          <button className="epub-nav-btn epub-nav-next" onClick={goNext} aria-label="Page suivante">›</button>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="epub-footer-zone">
      <div className="epub-footer">
        <span className="epub-progress-label">{progress}%</span>
        <input className="epub-progress-slider" type="range" min={0} max={100} value={progress}
          onChange={handleProgressChange} aria-label="Progression" />
        <span className="epub-page-counter">
          {locationsReady && totalPages > 0 ? `${currentPage} / ${totalPages}` : '…'}
        </span>
      </div>
      </div>{/* end epub-footer-zone */}

      {/* ── NOTE MODAL ── */}
      {noteModal.visible && (
        <div className="epub-modal-backdrop" onClick={() => setNoteModal((m) => ({ ...m, visible: false }))}>
          <div className="epub-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="epub-modal-title">Ajouter une note</h3>
            <blockquote className="epub-modal-excerpt">
              « {noteModal.text.slice(0, 140)}{noteModal.text.length > 140 ? '…' : ''} »
            </blockquote>
            <textarea className="epub-modal-textarea" placeholder="Votre note…" rows={4}
              value={noteModal.content} onChange={(e) => setNoteModal((m) => ({ ...m, content: e.target.value }))} autoFocus />
            <div className="epub-modal-privacy">
              <label className={noteModal.isPrivate ? 'active' : ''}>
                <input type="radio" name="privacy" checked={noteModal.isPrivate}
                  onChange={() => setNoteModal((m) => ({ ...m, isPrivate: true }))} />
                🔒 Privée
              </label>
              <label className={!noteModal.isPrivate ? 'active' : ''}>
                <input type="radio" name="privacy" checked={!noteModal.isPrivate}
                  onChange={() => setNoteModal((m) => ({ ...m, isPrivate: false }))} />
                🌍 Publique
              </label>
            </div>
            <div className="epub-modal-actions">
              <button className="epub-btn-cancel" onClick={() => setNoteModal((m) => ({ ...m, visible: false }))}>Annuler</button>
              <button className="epub-btn-save" onClick={submitNote}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
