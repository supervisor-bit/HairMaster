import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductList } from '../components/ProductList';
import { ProductForm } from '../components/ProductForm';
import { ProductDetail } from '../components/ProductDetail';
import { ProductCategoryHelp } from '../components/ProductCategoryHelp';
import { downloadProductTemplate, parseProductCSV } from '../utils/csvHelper';
import { useToast } from '../components/Toast';
import { db } from '../firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';

export function ProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const { addToast } = useToast();
    const [view, setView] = useState('list'); // 'list', 'detail', 'form'
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [confirmDialog, setConfirmDialog] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    const handleCreate = () => {
        setSelectedProduct(null);
        setView('form');
    };

    const handleSelect = (product) => {
        setSelectedProduct(product);
        setView('detail');
    };

    const handleEditFromDetail = () => {
        setView('form');
    };

    const handleSave = (data, keepOpen = false) => {
        if (selectedProduct) {
            updateProduct(selectedProduct.id, data);
            setSelectedProduct({ ...selectedProduct, ...data });
            addToast('Změny uloženy ✅', 'success');
            if (!keepOpen) setView('detail');
        } else {
            addProduct(data);
            addToast('Produkt vytvořen 🆕', 'success');
            if (!keepOpen) setView('list');
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            message: 'Opravdu chcete smazat tento produkt?',
            onConfirm: () => {
                deleteProduct(id);
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsedProducts = parseProductCSV(event.target.result);
                if (parsedProducts.length === 0) throw new Error('Žádné produkty k importu');

                if (!window.confirm(`Nalezeno ${parsedProducts.length} produktů. Chcete je importovat?`)) return;

                addToast('Importuji produkty...', 'info');
                const batch = writeBatch(db);

                parsedProducts.forEach(p => {
                    const newProdRef = doc(collection(db, 'products'));
                    const prodId = newProdRef.id;

                    // Add Product
                    batch.set(newProdRef, { ...p, createdAt: new Date().toISOString() });

                    // Add Initial Stock Movement if stock > 0
                    if (Number(p.stock) > 0) {
                        const moveRef = doc(collection(db, 'stock_movements'));
                        batch.set(moveRef, {
                            id: moveRef.id,
                            productId: prodId,
                            count: Number(p.stock),
                            type: 'import',
                            date: new Date().toISOString(),
                            note: 'CSV Import'
                        });
                    }
                });

                await batch.commit();
                addToast(`Úspěšně importováno ${parsedProducts.length} produktů ✅`, 'success');
            } catch (error) {
                console.error(error);
                addToast('Chyba importu: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };



    if (view === 'detail' && selectedProduct) {
        return (
            <ProductDetail
                product={products.find(p => p.id === selectedProduct.id) || selectedProduct}
                onEdit={handleEditFromDetail}
                onBack={() => setView('list')}
            />
        );
    }

    if (view === 'form') {
        return (
            <ProductForm
                product={selectedProduct}
                onSubmit={handleSave}
                onCancel={() => {
                    if (selectedProduct) setView('detail');
                    else setView('list');
                }}
            />
        );
    }

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <div className="flex-between">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Inventář</h2>
                            <button
                                onClick={() => setShowHelp(true)}
                                className="btn-ghost"
                                title="Nápověda ke kategoriím"
                                style={{
                                    padding: '4px',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--text-muted)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem'
                                }}
                            >
                                ?
                            </button>
                        </div>
                        <p className="text-muted">Správa produktů a skladových zásob.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {products.length === 0 && (
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={downloadProductTemplate}
                                    title="Stáhnout šablonu pro Excel"
                                >
                                    📄 Šablona
                                </button>
                                <label className="btn btn-secondary" style={{ cursor: 'pointer' }} title="Nahrát vyplněnou šablonu">
                                    📥 Import CSV
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleImportCSV}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </>
                        )}

                        <button className="btn btn-primary" onClick={handleCreate}>
                            + Přidat Produkt
                        </button>
                    </div>
                </div >
            </header >

            <div className="content-area">
                <ProductList
                    products={products}
                    onEdit={handleSelect}
                    onDelete={handleDelete}
                />
            </div>

            {
                showHelp && (
                    <ProductCategoryHelp onClose={() => setShowHelp(false)} />
                )
            }



            {
                confirmDialog && (
                    <ConfirmDialog
                        message={confirmDialog.message}
                        onConfirm={confirmDialog.onConfirm}
                        onCancel={confirmDialog.onCancel}
                    />
                )
            }
        </div >
    );
}
