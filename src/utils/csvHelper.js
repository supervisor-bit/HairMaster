export const PRODUCT_CSV_HEADERS = [
    'name',
    'brand',
    'category',
    'stock',
    'unit',
    'packageSize',
    'minStock',
    'ean',
    'price',
    'description'
];

export const PRODUCT_CSV_EXAMPLE = [
    'Loreal Inoa 6.0;Loreal;color;10;g;60;5;123456789;350;Základní barva',
    'Šampon Silver;Matrix;care;5;ks;;2;;290;Pro blond vlasy',
    'Peroxid 6%;Loreal;oxidant;3;ml;1000;1;;150;Vyvíječ'
];

export const downloadProductTemplate = () => {
    const headers = PRODUCT_CSV_HEADERS.join(';');
    const example = PRODUCT_CSV_EXAMPLE.join('\n');
    const content = `${headers}\n${example}`;

    // Add BOM for Excel utf-8 compatibility
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sablona_produkty.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

export const parseProductCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error('Soubor neobsahuje žádná data');

    const headers = lines[0].trim().split(';');
    const result = [];

    // Simple validation of headers
    // We assume strict order or map by index match. 
    // For simplicity, let's assume the user uses our template and order is preserved.

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(';');

        // Basic mapping based on known order
        const product = {
            name: values[0]?.trim() || '',
            brand: values[1]?.trim() || '',
            category: values[2]?.trim() || 'other',
            stock: values[3] ? Number(values[3].replace(',', '.')) : 0,
            unit: values[4]?.trim() || 'ks',
            packageSize: values[5] ? Number(values[5].replace(',', '.')) : '',
            minStock: values[6] ? Number(values[6].replace(',', '.')) : '',
            ean: values[7]?.trim() || '',
            price: values[8] ? Number(values[8].replace(',', '.')) : '',
            description: values[9]?.trim() || ''
        };

        if (product.name) {
            result.push(product);
        }
    }

    return result;
};
