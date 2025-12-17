import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useVisits() {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setVisits([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'visits'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const visitsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setVisits(visitsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching visits:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addVisit = async (visit) => {
        if (!currentUser) return;
        const id = crypto.randomUUID();
        const newVisit = {
            id,
            createdAt: new Date().toISOString(),
            ...visit
        };
        await setDoc(doc(db, 'visits', id), newVisit);
        return newVisit;
    };

    const updateVisit = async (id, updates) => {
        if (!currentUser) return;
        const visitRef = doc(db, 'visits', id);
        await setDoc(visitRef, updates, { merge: true });
    };

    const deleteVisit = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'visits', id));
    };

    const getClientVisits = (clientId) => {
        return visits.filter(v => v.clientId === clientId);
    };

    return {
        visits,
        loading,
        addVisit,
        updateVisit,
        deleteVisit,
        getClientVisits,
        getVisitsByClient: getClientVisits
    };
}
