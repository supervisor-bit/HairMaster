import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useProducts() {
    const [products, setProducts] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    // 1. Subscribe to Products
    useEffect(() => {
        if (!currentUser) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'products'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // 2. Subscribe to Stock Movements
    useEffect(() => {
        if (!currentUser) {
            setMovements([]);
            return;
        }

        const q = query(collection(db, 'stock_movements'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const movementsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMovements(movementsData);
        }, (error) => console.error("Error fetching movements:", error));

        return () => unsubscribe();
    }, [currentUser]);

    const addProduct = async (product) => {
        if (!currentUser) return;
        const id = crypto.randomUUID();
        const newProduct = {
            id,
            createdAt: new Date().toISOString(),
            ...product
        };
        await setDoc(doc(db, 'products', id), newProduct);
        return newProduct;
    };

    const updateProduct = async (id, updates) => {
        if (!currentUser) return;
        const productRef = doc(db, 'products', id);
        await setDoc(productRef, updates, { merge: true });
    };

    const updateStock = async (id, amountChange, type = 'manual', note = '') => {
        if (!currentUser) return;

        const product = products.find(p => p.id === id);
        if (!product) return;

        const currentStock = Number(product.stock) || 0;
        const newStock = Math.max(0, currentStock + amountChange);

        const movementId = crypto.randomUUID();
        const movement = {
            id: movementId,
            productId: id,
            count: Number(amountChange),
            type, // 'import', 'sale', 'visit', 'consumption', 'manual'
            date: new Date().toISOString(),
            note
        };

        const batch = writeBatch(db);
        batch.update(doc(db, 'products', id), { stock: newStock });
        batch.set(doc(db, 'stock_movements', movementId), movement);

        await batch.commit();
    };

    const deleteProduct = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'products', id));
    };

    const getHistory = (productId) => {
        return movements.filter(m => m.productId === productId);
    };

    return {
        products,
        loading,
        addProduct,
        updateProduct,
        updateStock,
        deleteProduct,
        getHistory
    };
}
