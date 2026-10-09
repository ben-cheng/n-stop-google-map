export interface SavedStops {
  id: number;
  title: string;
  content: string;
  updatedAt: number;
}

const databaseName = 'n-stop-google-map';
const storeName = 'saved-stops';
let databasePromise: Promise<IDBDatabase> | undefined;

const openDatabase = (): Promise<IDBDatabase> => {
  if (!('indexedDB' in globalThis)) {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(storeName, {
          keyPath: 'id',
          autoIncrement: true,
        });
      };

      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };

      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error ?? new Error('Could not open the saved stops database.'));
      };

      request.onblocked = () => {
        databasePromise = undefined;
        reject(new Error('The saved stops database is blocked by another tab.'));
      };
    });
  }

  return databasePromise;
};

export const getSavedStops = async (): Promise<SavedStops[]> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).getAll() as IDBRequest<SavedStops[]>;
    let savedStops: SavedStops[] = [];

    request.onsuccess = () => {
      savedStops = request.result;
    };

    transaction.oncomplete = () => {
      resolve(savedStops.sort((left, right) => right.updatedAt - left.updatedAt));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Could not read saved stops.'));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('Reading saved stops was cancelled.'));
    };
  });
};

export const saveStops = async (title: string, content: string): Promise<void> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).add({
      title,
      content,
      updatedAt: Date.now(),
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Could not save these stops.'));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('Saving these stops was cancelled.'));
    };
  });
};
