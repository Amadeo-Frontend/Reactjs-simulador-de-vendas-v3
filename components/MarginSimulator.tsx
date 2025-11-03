import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Product, SaleItem, Sale } from '../types';
import { productsData } from '../data/products';
import Header from './Header';
import Card from './ui/Card';
import Input from './ui/Input';

declare const jspdf: any;
declare const html2canvas: any;

// Helper to format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// --- Sub-components defined in the same file to keep them co-located with their logic ---

// ProductSearch Component
interface ProductSearchProps {
    onProductSelect: (product: Product) => void;
    addedProductIds: Set<number>;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect, addedProductIds }) => {
    const [query, setQuery] = useState('');
    const filteredProducts = useMemo(() => {
        if (!query) return [];
        return productsData.filter(p =>
            p.nome.toLowerCase().includes(query.toLowerCase()) || p.sku.includes(query)
        ).slice(0, 5);
    }, [query]);

    return (
        <div className="relative">
            <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produto por nome ou SKU..."
            />
            {filteredProducts.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map(product => {
                        const isDisabled = addedProductIds.has(product.id) || product.custo === null;
                        return (
                            <li key={product.id}>
                                <button
                                    onClick={() => {
                                        onProductSelect(product);
                                        setQuery('');
                                    }}
                                    disabled={isDisabled}
                                    className={`w-full text-left px-4 py-2 ${isDisabled
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                            : 'hover:bg-primary-100 dark:hover:bg-primary-900'
                                        } text-slate-800 dark:text-slate-200`}
                                >
                                    <p className="font-semibold">{product.nome}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        SKU: {product.sku} - Custo: {product.custo !== null ? formatCurrency(product.custo) : 'N/A'}
                                    </p>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};


// SaleItemsTable Component
interface SaleItemsTableProps {
    items: SaleItem[];
    onUpdateQuantity: (id: number, quantity: number) => void;
    onUpdateBonusQuantity: (id: number, bonusQuantity: number) => void;
    onRemoveItem: (id: number) => void;
}

const SaleItemsTable: React.FC<SaleItemsTableProps> = ({ items, onUpdateQuantity, onUpdateBonusQuantity, onRemoveItem }) => {
    if (items.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhum produto adicionado a esta venda.</p>;
    }

    return (
        <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                    <tr>
                        <th scope="col" className="px-6 py-3">Produto</th>
                        <th scope="col" className="px-6 py-3">Custo Unit.</th>
                        <th scope="col" className="px-6 py-3">Venda Unit.</th>
                        <th scope="col" className="px-6 py-3">Qtd. Venda</th>
                        <th scope="col" className="px-6 py-3">Qtd. Bônus</th>
                        <th scope="col" className="px-6 py-3">Total</th>
                        <th scope="col" className="px-6 py-3">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{item.nome}</th>
                            <td className="px-6 py-4">{formatCurrency(item.custo ?? 0)}</td>
                            <td className="px-6 py-4">{formatCurrency(item.preco_venda)}</td>
                            <td className="px-6 py-4">
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                                    className="w-20"
                                    aria-label={`Quantidade de venda para ${item.nome}`}
                                />
                            </td>
                             <td className="px-6 py-4">
                                <Input
                                    type="number"
                                    min="0"
                                    value={item.bonusQuantity}
                                    onChange={(e) => onUpdateBonusQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                                    className="w-20"
                                    aria-label={`Quantidade de bônus para ${item.nome}`}
                                />
                            </td>
                            <td className="px-6 py-4 font-semibold">{formatCurrency(item.preco_venda * item.quantity)}</td>
                            <td className="px-6 py-4">
                                <button onClick={() => onRemoveItem(item.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Remover</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
            {items.map(item => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-4 border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.nome}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <span>Custo Unit.: <span className="font-medium">{formatCurrency(item.custo ?? 0)}</span></span>
                        <span>Venda Unit.: <span className="font-medium">{formatCurrency(item.preco_venda)}</span></span>
                        <span className="col-span-2">Total Venda: <span className="font-bold text-base text-slate-800 dark:text-slate-100">{formatCurrency(item.preco_venda * item.quantity)}</span></span>
                    </div>
                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <Input
                            label="Qtd. Venda"
                            type="number"
                            min="1"
                            id={`quantity-${item.id}`}
                            value={item.quantity}
                            onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                        />
                         <Input
                            label="Qtd. Bônus"
                            type="number"
                            min="0"
                            id={`bonus-${item.id}`}
                            value={item.bonusQuantity}
                            onChange={(e) => onUpdateBonusQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                        />
                    </div>
                     <button onClick={() => onRemoveItem(item.id)} className="w-full text-center py-2 text-sm font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md">Remover</button>
                </div>
            ))}
        </div>
        </>
    );
};


// ResultsSummary Component
interface ResultsSummaryProps {
    sales: Sale[];
}
const ResultsSummary: React.FC<ResultsSummaryProps> = ({ sales }) => {
    const { totalRevenue, totalProductCost, totalBonusCost, totalCashBonus, finalCost, profit, finalMargin } = useMemo(() => {
        let totalRevenue = 0;
        let totalProductCost = 0;
        let totalBonusCost = 0;
        let totalCashBonus = 0;

        for (const sale of sales) {
            totalRevenue += sale.items.reduce((acc, item) => acc + (item.preco_venda * item.quantity), 0);
            totalProductCost += sale.items.reduce((acc, item) => acc + ((item.custo ?? 0) * item.quantity), 0);
            totalBonusCost += sale.items.reduce((acc, item) => acc + ((item.custo ?? 0) * item.bonusQuantity), 0);
            totalCashBonus += sale.cashBonus;
        }
        
        const finalCost = totalProductCost + totalBonusCost + totalCashBonus;
        const profit = totalRevenue - finalCost;
        const finalMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return { totalRevenue, totalProductCost, totalBonusCost, totalCashBonus, finalCost, profit, finalMargin };
    }, [sales]);

    const getMarginColor = (margin: number) => {
        if (margin >= 30) return 'text-green-500';
        if (margin >= 15) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Resultado da Simulação</h2>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between items-center"><span>Total Venda:</span> <span className="font-semibold">{formatCurrency(totalRevenue)}</span></div>
                <div className="flex justify-between items-center"><span>Custo dos Produtos:</span> <span>{formatCurrency(totalProductCost)}</span></div>
                <div className="flex justify-between items-center"><span>Custo Bônus (Produto):</span> <span>{formatCurrency(totalBonusCost)}</span></div>
                <div className="flex justify-between items-center"><span>Custo Bônus (R$):</span> <span>{formatCurrency(totalCashBonus)}</span></div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-100"><span>Custo Final:</span> <span>{formatCurrency(finalCost)}</span></div>
                <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-100"><span>Lucro Bruto:</span> <span>{formatCurrency(profit)}</span></div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div className={`flex justify-between items-center text-2xl font-bold ${getMarginColor(finalMargin)}`}>
                    <span>Margem Final:</span>
                    <span>{finalMargin.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
};


// Main MarginSimulator Component
interface MarginSimulatorProps {
    onLogout: () => void;
}
const MarginSimulator: React.FC<MarginSimulatorProps> = ({ onLogout }) => {
    const [sales, setSales] = useState<Sale[]>([{ id: Date.now(), items: [], cashBonus: 0 }]);
    const pdfRef = useRef<HTMLDivElement>(null);

    const addSale = () => {
        setSales(prev => [...prev, { id: Date.now(), items: [], cashBonus: 0 }]);
    };
    
    const removeSale = (saleId: number) => {
        setSales(prev => prev.filter(sale => sale.id !== saleId));
    };
    
    const updateCashBonus = (saleId: number, bonus: number) => {
        setSales(prev => prev.map(sale => 
            sale.id === saleId ? { ...sale, cashBonus: Math.max(0, bonus) } : sale
        ));
    };

    const addSaleItem = (saleId: number, product: Product) => {
        setSales(prev => prev.map(sale => {
            if (sale.id === saleId) {
                const isAdded = sale.items.some(item => item.id === product.id);
                if (product.custo === null || isAdded) return sale;
                const newItems = [...sale.items, { ...product, quantity: 1, bonusQuantity: 0 }];
                return { ...sale, items: newItems };
            }
            return sale;
        }));
    };
    
    const removeSaleItem = (saleId: number, itemId: number) => {
        setSales(prev => prev.map(sale => 
            sale.id === saleId ? { ...sale, items: sale.items.filter(item => item.id !== itemId) } : sale
        ));
    };

    const updateSaleItemQuantity = (saleId: number, itemId: number, quantity: number) => {
        setSales(prev => prev.map(sale => 
            sale.id === saleId 
            ? { ...sale, items: sale.items.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item) } 
            : sale
        ));
    };

    const updateSaleItemBonusQuantity = (saleId: number, itemId: number, bonusQuantity: number) => {
        setSales(prev => prev.map(sale => 
            sale.id === saleId 
            ? { ...sale, items: sale.items.map(item => item.id === itemId ? { ...item, bonusQuantity: Math.max(0, bonusQuantity) } : item) } 
            : sale
        ));
    };

    const exportToPdf = useCallback(async () => {
        const input = pdfRef.current;
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
            pdf.save(`simulacao_margem_${new Date().toISOString().slice(0,10)}.pdf`);
        } catch (error) {
            console.error("Error exporting to PDF", error);
        }
    }, []);
    
    const hasResults = useMemo(() => sales.some(sale => sale.items.length > 0 || sale.cashBonus > 0), [sales]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
            <Header onLogout={onLogout} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {sales.map((sale, index) => {
                            const addedProductIds = new Set(sale.items.map(item => item.id));
                            return (
                                <Card key={sale.id}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Venda #{index + 1}</h2>
                                        {sales.length > 1 && (
                                            <button 
                                                onClick={() => removeSale(sale.id)}
                                                className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900"
                                            >
                                                Remover Venda
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">1. Adicionar Produtos</h3>
                                            <ProductSearch onProductSelect={(product) => addSaleItem(sale.id, product)} addedProductIds={addedProductIds} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">2. Adicionar Bônus (R$)</h3>
                                            <Input
                                                type="number"
                                                placeholder="Ex: 50.00"
                                                value={sale.cashBonus || ''}
                                                onChange={(e) => updateCashBonus(sale.id, parseFloat(e.target.value) || 0)}
                                                aria-label={`Bonificação em reais para Venda #${index + 1}`}
                                            />
                                        </div>
                                         <div>
                                             <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Produtos na Venda</h3>
                                             <SaleItemsTable 
                                                items={sale.items} 
                                                onUpdateQuantity={(itemId, qty) => updateSaleItemQuantity(sale.id, itemId, qty)} 
                                                onUpdateBonusQuantity={(itemId, bonusQty) => updateSaleItemBonusQuantity(sale.id, itemId, bonusQty)}
                                                onRemoveItem={(itemId) => removeSaleItem(sale.id, itemId)} 
                                            />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        <button
                            onClick={addSale}
                            className="w-full px-6 py-3 border-2 border-dashed border-primary-400 text-primary-600 dark:text-primary-300 font-semibold rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all"
                        >
                            + Adicionar Outra Venda
                        </button>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="lg:sticky top-8 space-y-8">
                            <Card ref={pdfRef} className="!p-8">
                                <ResultsSummary sales={sales} />
                            </Card>
                             <button
                                onClick={exportToPdf}
                                disabled={!hasResults}
                                className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all"
                            >
                                Exportar para PDF
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MarginSimulator;