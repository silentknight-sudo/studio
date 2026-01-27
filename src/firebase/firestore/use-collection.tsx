'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where, getDocs, Query, DocumentData, CollectionReference } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type CollectionOptions = {
  track: boolean;
};

function isQuery(obj: any): obj is Query {
    return obj && typeof obj.where === 'function';
}

export const useCollection = <T extends DocumentData>(
    ref: Query<T> | CollectionReference<T> | null | undefined,
    options?: CollectionOptions
  ) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!ref) {
        setData([]);
        setLoading(false);
        return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setData(docs as T[]);
        setLoading(false);
      },
      async (err) => {
        console.error(err);
        setError(err);
        setLoading(false);

        const permissionError = new FirestorePermissionError({
            path: isQuery(ref) ? 'Query' : ref.path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [ref?.toString()]); // Use a stable dependency

  return { data, loading, error };
};
