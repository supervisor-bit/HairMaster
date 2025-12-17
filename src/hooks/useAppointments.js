import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setAppointments([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'appointments'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAppointments(appsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addAppointment = async (appointment) => {
        if (!currentUser) return;
        const id = crypto.randomUUID();
        const newAppointment = {
            id,
            createdAt: new Date().toISOString(),
            ...appointment
        };
        await setDoc(doc(db, 'appointments', id), newAppointment);
        return newAppointment;
    };

    const deleteAppointment = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'appointments', id));
    };

    const updateAppointment = async (id, updates) => {
        if (!currentUser) return;
        const appRef = doc(db, 'appointments', id);
        await setDoc(appRef, updates, { merge: true });
    };

    return {
        appointments,
        loading,
        addAppointment,
        deleteAppointment,
        updateAppointment
    };
}
