import {
    doc,
    setDoc,
    addDoc,
    deleteDoc,
    collection,
    Firestore,
  } from 'firebase/firestore';
  import { errorEmitter } from '@/firebase/error-emitter';
  import { FirestorePermissionError } from '@/firebase/errors';
  
  export async function addOrUpdateDoc(
    db: Firestore,
    path: string,
    data: any,
    merge = true
  ) {
    const isCollection = path.split('/').length % 2 !== 0;
    const ref = isCollection
      ? collection(db, path)
      : doc(db, path);
  
    try {
      if (isCollection) {
        await addDoc(ref as any, data);
      } else {
        await setDoc(ref as any, data, { merge });
      }
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'write',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // re-throw to be caught by component
    }
  }
  
  export async function deleteDocument(db: Firestore, path: string) {
    const ref = doc(db, path);
    try {
        await deleteDoc(ref);
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
  }
  