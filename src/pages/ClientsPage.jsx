import { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import { ClientList } from '../components/ClientList';
import { ClientDetail } from '../components/ClientDetail';
import { ClientForm } from '../components/ClientForm';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ClientsPage({ params }) {
    const { clients, addClient, updateClient, deleteClient } = useClients();
    const [view, setView] = useState('list'); // 'list', 'detail', 'form'
    const [selectedClient, setSelectedClient] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    useEffect(() => {
        if (params?.openClientDetail && clients.length > 0) {
            const client = clients.find(c => c.id === params.openClientDetail);
            if (client) {
                setSelectedClient(client);
                setView('detail');
            }
        }
    }, [params, clients]);

    const handleCreate = () => {
        setSelectedClient(null);
        setView('create');
    };

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setView('detail');
    };

    const handleSaveClient = (data) => {
        if (selectedClient) {
            // Update existing logic is handled inside Detail view too, but if creating new:
            updateClient(selectedClient.id, data);
        } else {
            addClient(data);
        }
        setView('list');
    };

    const handleUpdateFromDetail = (updatedClient) => {
        updateClient(updatedClient.id, updatedClient);
        // Stay in detail view, but update the local state to reflect changes immediately in UI
        setSelectedClient(updatedClient);
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            message: 'Opravdu chcete smazat tohoto klienta?',
            onConfirm: () => {
                deleteClient(id);
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    if (view === 'detail' && selectedClient) {
        return <ClientDetail
            client={selectedClient}
            onBack={() => setView('list')}
            onUpdateClient={handleUpdateFromDetail}
            initialStartVisit={params?.startVisit}
            initialNote={params?.appointmentNote}
        />;
    }

    if (view === 'create') {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <ClientForm onSubmit={handleSaveClient} onCancel={() => setView('list')} />
            </div>
        );
    }

    return (
        <div className="page-layout fade-in">
            <header className="page-header flex-between">
                <div>
                    <h2 style={{ fontSize: '1.875rem' }}>Klienti</h2>
                    <p className="text-muted">Databáze zákazníků a historie.</p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                    + Nový klient
                </button>
            </header>

            <div style={{ flex: 1, overflow: 'hidden', padding: '0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl)' }}>
                <ClientList
                    clients={clients}
                    onSelect={handleSelectClient}
                    onDelete={handleDelete}
                />
            </div>

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
