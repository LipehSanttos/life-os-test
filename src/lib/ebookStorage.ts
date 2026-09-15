/**
 * @file ebookStorage.ts
 * @description Armazenamento local de alta capacidade via IndexedDB para eBooks (PDF e EPUB).
 * Permite que arquivos de até centenas de megabytes sejam salvos e lidos instantaneamente
 * mesmo em ambientes serverless/edge (Cloudflare Workers) ou offline.
 */

const DB_NAME = "lifeos_ebooks_db";
const STORE_NAME = "ebook_blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB não suportado neste ambiente."));
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva um arquivo Blob/File de eBook no IndexedDB do navegador.
 * Retorna uma URI interna padronizada no formato `idb:<chave>`.
 */
export async function saveEbookToIndexedDB(key: string, file: Blob): Promise<string> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const idbKey = `ebook_${key}`;

    store.put(file, idbKey);

    tx.oncomplete = () => resolve(`idb:${idbKey}`);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Recupera o Blob de um eBook do IndexedDB.
 */
export async function getEbookFromIndexedDB(keyWithPrefix: string): Promise<Blob | null> {
  const db = await openDb();
  const key = keyWithPrefix.replace(/^idb:/, "");

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(key);

    getReq.onsuccess = () => resolve(getReq.result || null);
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Remove um eBook do IndexedDB.
 */
export async function removeEbookFromIndexedDB(keyWithPrefix: string): Promise<void> {
  try {
    const db = await openDb();
    const key = keyWithPrefix.replace(/^idb:/, "");
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Falha ao remover do IndexedDB:", e);
  }
}
