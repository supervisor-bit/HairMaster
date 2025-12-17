
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useSalonInfo() {
    const [salonInfo, setSalonInfo] = useState({
        name: 'HairMaster Salon',
        address: '',
        phone: '',
        email: '',
        ico: '',
        dic: ''
    });
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'settings', 'salon_info');

        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                setSalonInfo(prev => ({ ...prev, ...docSnap.data() }));
            } else {
                // Migration logic: If cloud doc doesn't exist, try to read local, then save to cloud
                const saved = localStorage.getItem('salonInfo');
                if (saved) {
                    try {
                        const localData = JSON.parse(saved);
                        await setDoc(docRef, localData); // Upload local to cloud
                    } catch (e) {
                        console.error("Migration failed", e);
                    }
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const updateSalonInfo = async (newData) => {
        if (!currentUser) return;
        const docRef = doc(db, 'settings', 'salon_info');
        await setDoc(docRef, newData, { merge: true });
        // Also update local for offline redundancy/speed if we wanted, but single source of truth is better
        // localStorage.setItem('salonInfo', JSON.stringify(newData)); 
    };

    return { salonInfo, updateSalonInfo, loading };
}
