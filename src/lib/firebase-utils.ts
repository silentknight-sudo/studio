import {
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  Firestore,
  DocumentData,
  WithFieldValue,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';

/**
 * Adds a new document to a collection or updates an existing document with type safety.
 * @template T - The type of the document data, extending DocumentData.
 * @param db - The Firestore instance.
 * @param path - The path to the collection (for add) or document (for set).
 * @param data - The data to be written.
 * @param merge - Whether to merge data for existing documents (default: true).
 */
export async function addOrUpdateDoc<T extends DocumentData>(
  db: Firestore,
  path: string,
  data: WithFieldValue<T>,
  merge = true
): Promise<void> {
  const pathSegments = path.split('/').filter(Boolean);
  const isCollection = pathSegments.length % 2 !== 0;

  try {
    if (isCollection) {
      const colRef = collection(db, path) as CollectionReference<T>;
      await addDoc(colRef, data);
    } else {
      const docRef = doc(db, path) as DocumentReference<T>;
      await setDoc(docRef, data, { merge });
    }
  } catch (error) {
    console.error(`Firestore Write Error [${path}]:`, error);
    throw error;
  }
}

/**
 * Deletes a document from Firestore with standard error logging.
 */
export async function deleteDocument(db: Firestore, path: string): Promise<void> {
  try {
    const ref = doc(db, path);
    await deleteDoc(ref);
  } catch (error) {
    console.error(`Firestore Delete Error [${path}]:`, error);
    throw error;
  }
}
