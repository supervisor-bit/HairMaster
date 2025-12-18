import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export const COLLECTIONS_TO_BACKUP = [
    'clients',
    'products',
    'visits',
    'appointments',
    'transactions',
    'service_templates',
    'salon_info'
];

export const exportData = async () => {
    const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {}
    };

    for (const colName of COLLECTIONS_TO_BACKUP) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        backup.data[colName] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    return backup;
};

export const importData = async (jsonData) => {
    try {
        const data = jsonData.data;
        if (!data) throw new Error('Neplatný formát zálohy');

        const batch = writeBatch(db);
        let operationCount = 0;

        for (const colName of COLLECTIONS_TO_BACKUP) {
            if (data[colName] && Array.isArray(data[colName])) {
                for (const item of data[colName]) {
                    const { id, ...docData } = item;
                    if (id) {
                        const docRef = doc(db, colName, id);
                        batch.set(docRef, docData);
                        operationCount++;
                    }
                }
            }
        }

        // Firebase limit for batch is 500. For large backups, we might need to chunk this.
        // For this implementation, assuming small to medium data. If > 500, we'd loop batches.
        // A simple recursive chunking approach:
        if (operationCount > 450) {
            // TODO: Implement chunking if needed. For now warning.
            console.warn("Large backup restore. Ideally split into chunks.");
        }

        // Actually, let's just do simple chunking right now to be safe.
        // Refactoring to write immediately in chunks of 400.
    } catch (error) {
        console.error('Import failed', error);
        throw error;
    }
};

// Better implementation with chunking
export const restoreDataSafe = async (jsonData) => {
    const data = jsonData.data;
    if (!data) throw new Error('Neplatný formát zálohy');

    let currentBatch = writeBatch(db);
    let count = 0;
    const BATCH_SIZE = 400;

    for (const colName of COLLECTIONS_TO_BACKUP) {
        if (data[colName] && Array.isArray(data[colName])) {
            for (const item of data[colName]) {
                const { id, ...docData } = item;
                if (id) {
                    const docRef = doc(db, colName, id);
                    currentBatch.set(docRef, docData);
                    count++;

                    if (count >= BATCH_SIZE) {
                        await currentBatch.commit();
                        currentBatch = writeBatch(db);
                        count = 0;
                    }
                }
            }
        }
    }

    if (count > 0) {
        await currentBatch.commit();
    }

    return true;
};
