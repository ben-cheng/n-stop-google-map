import { useEffect, useState } from 'react'
import GoogleMapUrlGenerator from './utils/GoogleMapUrlGenerator'
import ExtractLocations from './utils/ExtractLocations'
import { getSavedStops, saveStops, type SavedStops } from './utils/SavedStopsStore'
import './App.css'
import { useLocalStorage } from 'usehooks-ts';
import { createWorker } from 'tesseract.js';
import pkg from '../package.json' with { type: 'json' };

const localStorageKey = "n-stop-google-map-input";

const App: React.FC = () => {
  const [input, setInput] = useLocalStorage<string>(localStorageKey, '');
  const [mapUrl, setMapUrl] = useState<string>("");
  const [saveTitle, setSaveTitle] = useState('');
  const [savedStops, setSavedStops] = useState<SavedStops[]>([]);
  const [storageMessage, setStorageMessage] = useState('');

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
      await saveStops(title, input);
      setSavedStops(await getSavedStops());
      setSaveTitle('');
      setStorageMessage(`Saved "${title}".`);
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Could not save these stops.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">N-stop Google Map</h1>

      <p><input type="button" value="Clear" onClick={() => setInput('')} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4" /></p>

      <label htmlFor="textInput" className="block mb-2 font-medium">
        Enter stops (one per line):
      </label>

      <textarea
        id="textInput"
        value={input}
        onChange={handleInputChange}
        className="w-full h-80 p-3 border rounded-lg mb-4"
        placeholder="Enter each stop on a new line..."
        onPaste={HandlePaste}
      />

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Save this route</h2>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="saveTitle" className="sr-only">Route title</label>
          <input
            id="saveTitle"
            type="text"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSaveStops();
              }
            }}
            placeholder="Name this route"
            className="min-w-0 flex-1 p-2 border rounded"
          />
          <button
            type="button"
            onClick={() => void handleSaveStops()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
        {storageMessage && <p role="status" className="mt-2 text-sm">{storageMessage}</p>}
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Saved routes</h2>
        {savedStops.length > 0 ? (
          <ul className="space-y-2">
            {savedStops.map((saved) => (
              <li key={saved.id} className="flex flex-wrap items-center justify-between gap-2 border rounded p-3">
                <span>{saved.title}</span>
                <button
                  type="button"
                  onClick={() => {
                    setInput(saved.content);
                    setStorageMessage(`Loaded "${saved.title}".`);
                  }}
                  className="text-blue-600 underline"
                >
                  Load
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No routes saved yet.</p>
        )}
      </section>

      <div className="wrap-break-word mb-6 min-h-24">
        {!!mapUrl.length && (
          <>
            <h2 className="text-xl font-semibold mb-2">Generated Google Maps Link:</h2>
            <a
              id="link"
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {mapUrl}
            </a>
          </>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">About N-stop Google Map</h2>
        <p className="mb-4">
          N-stop Google Map helps you create and visualize routes with multiple stops using
          Google Maps. It’s designed to help plan trips with several destinations efficiently.
        </p>

        <h3 className="text-lg font-semibold">Features:</h3>
        <ul className="list-disc list-inside mb-4">
          <li>Add multiple stops to your route</li>
          <li>View the entire route on Google Maps</li>
          <li>Get directions and estimated travel times</li>
          <li>Save and share your routes</li>
        </ul>

        <h3 className="text-lg font-semibold">How to Use:</h3>
        <ol className="list-decimal list-inside">
          <li>Enter your starting point and destination.</li>
          <li>Add any additional stops you want to include.</li>
          <li>Copy or click the generated Google Maps link.</li>
          <li>Use the provided directions to navigate your trip.</li>
        </ol>

        <p className="text-sm text-gray-500">
          version: {pkg.version}
        </p>
      </div>
    </div>
  )
}

export default App
