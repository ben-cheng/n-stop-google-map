import { useEffect, useRef, useState } from 'react'
import GoogleMapUrlGenerator from './utils/GoogleMapUrlGenerator'
import ExtractLocations from './utils/ExtractLocations'
import { deleteSavedStops, getSavedStops, saveStops, type SavedStops } from './utils/SavedStopsStore'
import { useLocalStorage } from 'usehooks-ts';
import { createWorker } from 'tesseract.js';
import pkg from '../package.json' with { type: 'json' };

const localStorageKey = "n-stop-google-map-input";

const App: React.FC = () => {
  const [input, setInput] = useLocalStorage<string>(localStorageKey, '');
  const [mapUrl, setMapUrl] = useState<string>("");
  const [saveTitle, setSaveTitle] = useState('');
  const [savedStops, setSavedStops] = useState<SavedStops[]>([]);
  const [savedRoutesSearch, setSavedRoutesSearch] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
  };

  const HandlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let insertedText = '';

    // Handle file paste
    if (e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];

      if (!file) {
        insertedText = 'Not a file';
      } else {
        const worker = await createWorker('eng');
        const ret = await worker.recognize(file);

        insertedText = ret.data.text || 'No text recognized';
      }
    } else {
      // Handle normal text paste
      insertedText = e.clipboardData.getData('text');
    }

    // Normalize line endings
    insertedText = insertedText.replace(/\r\n|\r|\n/g, '\n');
    insertedText = ExtractLocations(insertedText);

    // Insert text at cursor/selection
    setInput((current) => {
      return current.slice(0, start) + insertedText + current.slice(end);
    });

    // Restore cursor position after inserted text
    requestAnimationFrame(() => {
      const newPosition = start + insertedText.length;

      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    });
  };

  useEffect(() => {
    const fullUrl = GoogleMapUrlGenerator(input);
    setMapUrl(fullUrl);
  }, [input]);

  useEffect(() => {
    let isCurrent = true;

    getSavedStops()
      .then((saved) => {
        if (isCurrent) {
          setSavedStops(saved);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setStorageMessage(error instanceof Error ? error.message : 'Could not load saved stops.');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSaveStops = async () => {
    const title = saveTitle.trim();
    if (!title || !input.trim()) {
      setStorageMessage('Enter a title and at least one stop before saving.');
      return;
    }

    try {
      const updated = await saveStops(title, input);
      setSavedStops(await getSavedStops());
      setSaveTitle('');
      setStorageMessage(`${updated ? 'Updated' : 'Saved'} "${title}".`);
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Could not save these stops.');
    }
  };

  const handleDeleteSavedStops = async (saved: SavedStops) => {
    if (!window.confirm(`Delete the saved route "${saved.title}"?`)) {
      return;
    }

    try {
      await deleteSavedStops(saved.id);
      setSavedStops(await getSavedStops());
      setStorageMessage(`Deleted "${saved.title}".`);
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Could not delete this saved route.');
    }
  };

  const searchTerm = savedRoutesSearch.trim().toLocaleLowerCase();
  const filteredSavedStops = savedStops.filter((saved) =>
    `${saved.title}\n${saved.content}`.toLocaleLowerCase().includes(searchTerm),
  );

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <a
        className="absolute left-4 top-3 z-10 -translate-y-20 rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="mb-7">
        <p className="mb-1 text-sm font-bold uppercase tracking-widest text-blue-900">Plan your journey</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">N-stop Google Map</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-700">
          Build a multi-stop route, save it for later, and open it in Google Maps.
        </p>
      </header>

      <main id="main-content" className="scroll-mt-4">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.9fr)]">
          <section
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            aria-labelledby="route-editor-heading"
          >
            <h2 id="route-editor-heading" className="mb-4 text-xl font-bold text-slate-950">Your route</h2>

            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInput('')}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-400 bg-white px-3 py-2 font-semibold text-blue-950 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Clear stops
              </button>
            </div>

            <label htmlFor="textInput" className="mb-2 block font-semibold text-slate-800">
              Stops <span>(one per line)</span>
            </label>

            <div className="mb-5 flex h-84 w-full overflow-hidden rounded-xl border border-slate-500 bg-white">
              <div
                ref={lineNumbersRef}
                aria-hidden="true"
                className="min-w-12 shrink-0 overflow-hidden border-r border-slate-200 bg-slate-100 px-2 py-3 text-right font-mono text-sm leading-6 text-slate-700 select-none"
              >
                {input.split('\n').map((_, index) => (
                  <div key={index}>{index + 1}</div>
                ))}
              </div>
              <textarea
                id="textInput"
                value={input}
                onChange={handleInputChange}
                onScroll={(e) => {
                  if (lineNumbersRef.current) {
                    lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                  }
                }}
                className="min-h-0 min-w-0 flex-1 resize-none border-0 bg-white p-3 font-mono text-base leading-6 text-slate-900 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700"
                placeholder="Enter each stop on a new line..."
                onPaste={HandlePaste}
                wrap="off"
                spellCheck={false}
              />
            </div>

            <section aria-labelledby="save-route-heading">
              <h3 id="save-route-heading" className="mb-3 text-lg font-bold text-slate-950">Save this route</h3>
              <label htmlFor="saveTitle" className="mb-2 block font-semibold text-slate-800">Route title</label>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSaveStops();
                }}
              >
                <input
                  id="saveTitle"
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Name this route"
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-500 bg-white px-3 py-2 text-slate-950 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  Save route
                </button>
              </form>
              <p className="mt-3 min-h-6 wrap-break-word text-slate-800" role="status" aria-live="polite">
                {storageMessage}
              </p>
            </section>

            {mapUrl && (
              <section
                className="mt-5 rounded-xl border-l-4 border-blue-900 bg-blue-50 p-4"
                aria-labelledby="map-link-heading"
              >
                <h3 id="map-link-heading" className="mb-2 text-lg font-bold text-slate-950">Open your route</h3>
                <a
                  id="link"
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block min-h-11 break-all py-2 font-semibold text-blue-900 underline decoration-2 underline-offset-4 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  View route in Google Maps
                </a>
              </section>
            )}
          </section>

          <aside
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            aria-labelledby="saved-routes-heading"
          >
            <h2 id="saved-routes-heading" className="mb-4 text-xl font-bold text-slate-950">Saved routes</h2>
            <label htmlFor="savedRoutesSearch" className="mb-2 block font-semibold text-slate-800">
              Search saved routes
            </label>
            <input
              id="savedRoutesSearch"
              type="search"
              value={savedRoutesSearch}
              onChange={(e) => setSavedRoutesSearch(e.target.value)}
              placeholder="Search by title or stop"
              className="mb-4 min-h-11 w-full rounded-lg border border-slate-500 bg-white px-3 py-2 text-slate-950 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            />
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {savedRoutesSearch
                ? `${filteredSavedStops.length} routes match your search.`
                : `${savedStops.length} saved routes.`}
            </p>
            {filteredSavedStops.length > 0 ? (
              <ul className="grid gap-2">
                {filteredSavedStops.map((saved) => (
                  <li
                    key={saved.id}
                    className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <span className="min-w-0 flex-1 wrap-break-word font-semibold text-slate-800">{saved.title}</span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInput(saved.content);
                          setStorageMessage(`Loaded "${saved.title}".`);
                        }}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-400 bg-white px-3 py-2 font-semibold text-blue-950 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                        aria-label={`Load ${saved.title}`}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteSavedStops(saved)}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-800 bg-white px-3 py-2 font-semibold text-red-900 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                        aria-label={`Delete ${saved.title}`}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : savedStops.length > 0 ? (
              <p className="text-slate-700">No saved routes match your search.</p>
            ) : (
              <p className="text-slate-700">No routes saved yet.</p>
            )}
          </aside>
        </div>

        <section
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
          aria-labelledby="about-heading"
        >
          <h2 id="about-heading" className="mb-3 text-xl font-bold text-slate-950">
            About N-stop Google Map
          </h2>
          <p className="text-slate-700">
            Plan trips with several destinations, save routes in this browser, and open them
            in Google Maps.
          </p>
          <div className="mt-4 grid gap-4 text-slate-700 sm:grid-cols-2 sm:gap-8">
            <div>
              <h3 className="mb-2 font-bold text-slate-900">Features</h3>
              <ul className="list-inside list-disc space-y-1">
                <li>Add multiple stops to a route</li>
                <li>View the route in Google Maps</li>
                <li>Save and load named routes</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-bold text-slate-900">How to use</h3>
              <ol className="list-inside list-decimal space-y-1">
                <li>Enter one location on each line.</li>
                <li>Name and save routes you want to keep.</li>
                <li>Open the generated route in Google Maps.</li>
              </ol>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-700">Version {pkg.version}</p>
        </section>
      </main>
    </div>
  )
}

export default App
