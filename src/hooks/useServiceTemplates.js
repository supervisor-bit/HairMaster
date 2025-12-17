import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useServiceTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setTemplates([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'service_templates'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTemplates(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching templates:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addTemplate = async (template) => {
        if (!currentUser) return;
        const id = crypto.randomUUID();
        const newTemplate = {
            id,
            createdAt: new Date().toISOString(),
            ...template
        };
        await setDoc(doc(db, 'service_templates', id), newTemplate);
        return newTemplate;
    };

    const deleteTemplate = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'service_templates', id));
    };

    return {
        templates,
        loading,
        addTemplate,
        deleteTemplate
    };
}
