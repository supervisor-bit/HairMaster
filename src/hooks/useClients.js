import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setClients([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'clients'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClients(clientsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching clients:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addClient = async (client) => {
        if (!currentUser) return;
        const id = crypto.randomUUID();
        const newClient = {
            id,
            createdAt: new Date().toISOString(),
            ...client
        };
        await setDoc(doc(db, 'clients', id), newClient);
        return newClient;
    };

    const updateClient = async (id, updates) => {
        if (!currentUser) return;
        const clientRef = doc(db, 'clients', id);
        await setDoc(clientRef, updates, { merge: true });
    };

    const deleteClient = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'clients', id));
    };

    return {
        clients,
        loading,
        addClient,
        updateClient,
        deleteClient
    };
}
