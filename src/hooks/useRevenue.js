import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useRevenue() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'revenue'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(transData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching revenue:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addTransaction = async (transaction) => {
        if (!currentUser) return;
        const id = crypto.randomUUID();
        const newTransaction = {
            id,
            date: new Date().toISOString(),
            ...transaction
        };
        await setDoc(doc(db, 'revenue', id), newTransaction);
        return newTransaction;
    };

    const deleteTransaction = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'revenue', id));
    };

    const getDailyTotal = (date = new Date()) => {
        const dateStr = date.toISOString().split('T')[0];
        return transactions
            .filter(t => t.date.startsWith(dateStr))
            .reduce((sum, t) => sum + Number(t.amount), 0);
    };

    const getMonthlyTotal = (date = new Date()) => {
        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
        return transactions
            .filter(t => t.date.startsWith(monthStr))
            .reduce((sum, t) => sum + Number(t.amount), 0);
    };

    return {
        transactions,
        loading,
        addTransaction,
        deleteTransaction,
        getDailyTotal,
        getMonthlyTotal
    };
}
