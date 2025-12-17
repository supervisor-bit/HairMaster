export const seedData = () => {
    const clients = [
        { id: 'c1', name: 'Jana Nováková', phone: '777 123 456', email: 'jana.novakova@example.com', notes: 'Citlivá pokožka' },
        { id: 'c2', name: 'Petr Svoboda', phone: '608 987 654', email: 'petr.svoboda@test.cz', notes: 'Pánský střih, vždy na krátko' },
        { id: 'c3', name: 'Alena Dvořáková', phone: '731 555 666', email: 'alena.d@seznam.cz', notes: 'Barvení Loreal 6.0' },
        { id: 'c4', name: 'Martin Kučera', phone: '602 111 222', email: '', notes: '' },
        { id: 'c5', name: 'Eva Procházková', phone: '775 333 444', email: 'eva.p@gmail.com', notes: 'Melír' }
    ];

    const products = [
        { id: 'p1', name: 'Loreal Inoa 6.0', brand: 'Loreal', price: '350', stock: '10', unit: 'g', packageSize: '60', category: 'color' },
        { id: 'p2', name: 'Šampon Silver', brand: 'Matrix', price: '290', stock: '5', unit: 'ks', category: 'other' },
        { id: 'p3', name: 'Kondicionér Color', brand: 'Wella', price: '320', stock: '8', unit: 'ks', category: 'other' },
        { id: 'p4', name: 'Peroxid 6%', brand: 'Loreal', price: '150', stock: '3', unit: 'g', packageSize: '1000', category: 'developer' },
        { id: 'p5', name: 'Lak na vlasy Strong', brand: 'Schwarzkopf', price: '180', stock: '12', unit: 'ks', category: 'other' },
        { id: 'p6', name: 'Olejíček Argan', brand: 'Moroccanoil', price: '850', stock: '2', unit: 'ks', category: 'other' },
        { id: 'p7', name: 'Barva Matrix 5N', brand: 'Matrix', price: '220', stock: '15', unit: 'g', packageSize: '90', category: 'color' },
        { id: 'p8', name: 'Maska Keratin', brand: 'Wella', price: '450', stock: '4', unit: 'ks', category: 'other' }
    ];

    const now = new Date();
    const visits = [
        { id: 'v1', clientId: 'c1', date: new Date(now.setDate(now.getDate() - 2)).toISOString(), services: 'Barvení, Střih', usedProducts: [{ productId: 'p1', amount: 30, name: 'Loreal Inoa 6.0' }], notes: 'Použito 30g barvy' },
        { id: 'v2', clientId: 'c3', date: new Date(now.setDate(now.getDate() - 5)).toISOString(), services: 'Foukaná', usedProducts: [{ productId: 'p5', amount: 1, name: 'Lak na vlasy Strong' }], notes: '' },
        { id: 'v3', clientId: 'c2', date: new Date(now.setDate(now.getDate() - 10)).toISOString(), services: 'Pánský střih', usedProducts: [], notes: '' }
    ];

    localStorage.setItem('hairmaster_clients', JSON.stringify(clients));
    localStorage.setItem('hairmaster_products', JSON.stringify(products));
    localStorage.setItem('hairmaster_visits', JSON.stringify(visits));

    window.location.reload();
};
