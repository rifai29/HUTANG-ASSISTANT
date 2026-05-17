import React, { createContext, useContext } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Debt } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface DbContextType {
  addDebt: (debt: Partial<Debt>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  subscribeToDebts: (callback: (debts: Debt[]) => void) => () => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const addDebt = async (debt: Partial<Debt>) => {
    if (!auth.currentUser) return;
    const path = 'debts';
    try {
      await addDoc(collection(db, path), {
        ...debt,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateDebt = async (id: string, debt: Partial<Debt>) => {
    const path = `debts/${id}`;
    try {
      await updateDoc(doc(db, 'debts', id), {
        ...debt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteDebt = async (id: string) => {
    const path = `debts/${id}`;
    try {
      await deleteDoc(doc(db, 'debts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const subscribeToDebts = (callback: (debts: Debt[]) => void) => {
    if (!auth.currentUser) return () => {};
    const path = 'debts';
    const q = query(
      collection(db, path), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const debts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      })) as Debt[];
      callback(debts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  };

  return (
    <DbContext.Provider value={{ addDebt, updateDebt, deleteDebt, subscribeToDebts }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
}
