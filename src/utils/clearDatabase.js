import { db } from '../firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

export const clearDatabase = async () => {
    const collections = [
        'clients',
        'products',
        'visits',
        'appointments',
        'transactions',
        'service_templates'
    ];

    try {
        for (const colName of collections) {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);

            if (snapshot.empty) continue;

            const batch = writeBatch(db);
            let counter = 0;

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
                counter++;
            });

            await batch.commit();
            console.log(`Cleared collection: ${colName} (${counter} documents)`);
        }
        return true;
    } catch (error) {
        console.error('Error clearing database:', error);
        throw error;
    }
};
