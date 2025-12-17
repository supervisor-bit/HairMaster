import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductList } from '../components/ProductList';
import { ProductForm } from '../components/ProductForm';
import { ProductDetail } from '../components/ProductDetail';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProductCategoryHelp } from '../components/ProductCategoryHelp';

export function ProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
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

    const handleSave = (data) => {
        if (selectedProduct) {
            updateProduct(selectedProduct.id, data);
            // Update selected product locally to reflect changes immediately if we go back to detail
            setSelectedProduct({ ...selectedProduct, ...data });
            setView('detail');
        } else {
            addProduct(data);
            setView('list');
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
                    <button className="btn btn-primary" onClick={handleCreate}>
                        + Přidat Produkt
                    </button>
                </div>
            </header>

            <div className="content-area">
                <ProductList
                    products={products}
                    onEdit={handleSelect}
                    onDelete={handleDelete}
                />
            </div>

            {showHelp && (
                <ProductCategoryHelp onClose={() => setShowHelp(false)} />
            )}

            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                />
            )}
        </div>
    );
}
