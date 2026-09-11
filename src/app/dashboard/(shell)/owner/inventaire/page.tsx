'use client';
import {
  useState,
  useMemo,
  useCallback,
  useTransition,
  memo,
  useEffect,
} from 'react';
import Image from 'next/image';
import { Search, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { getProducts, deleteProduct, type Product } from '@/lib/actions/inventory';
import ProductForm from '@/components/inventory/ProductForm';
import ProductDetailModal from '@/components/inventory/ProductDetailModal';

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function convertAmount(
  amount: number,
  rate: number,
  from: 'USD' | 'CDF',
  to: 'USD' | 'CDF'
): number {
  if (from === to) {
    return to === 'USD' ? roundToTwoDecimals(amount) : Math.round(amount);
  }
  if (from === 'USD' && to === 'CDF') {
    return Math.round(amount * rate);
  }
  if (from === 'CDF' && to === 'USD') {
    return roundToTwoDecimals(amount / rate);
  }
  throw new Error('Devises non prises en charge');
}

export function formatCurrency(amount: number, currency: 'USD' | 'CDF'): string {
  if (currency === 'CDF') {
    const rounded = Math.round(amount);
    const formattedNumber = rounded.toLocaleString('fr-FR', {
      maximumFractionDigits: 0,
      useGrouping: true,
    });
    return `${formattedNumber} FC`;
  } else {
    const rounded = roundToTwoDecimals(amount);
    const formattedNumber = rounded.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
    return `${formattedNumber} $`;
  }
}

const ITEMS_PER_PAGE = 6;

// Badge du mode QR
const QrModeBadge = memo(function QrModeBadge({ mode }: { mode: 'none' | 'model' | 'unique' }) {
  if (mode === 'none') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Sans QR
      </span>
    );
  }
  if (mode === 'model') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        QR Modèle
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
      QR Unique
    </span>
  );
});

// Composant de ligne Desktop
const ProductRow = memo(function ProductRow({
  product,
  exchangeRate,
  onEdit,
  onDelete,
  onDetails,
}: {
  product: Product;
  exchangeRate: number;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onDetails: (product: Product) => void;
}) {
  const productCurrency = product.currency || 'USD';
  const isStockBas = product.quantity <= product.stockAlerte;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-4 font-medium text-gray-900">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100 border border-gray-200">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm">📦</div>
            )}
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-medium text-gray-900">{product.name}</span>
            <div className="flex items-center gap-2">
              <QrModeBadge mode={product.qrMode || 'none'} />
              {isStockBas && (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-600/10">
                  ⚠️ Stock bas
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center text-gray-600">{product.quantity}</td>
      <td className="px-4 py-4 text-right text-gray-600">
        {formatCurrency(product.purchasePrice, productCurrency)}
      </td>
      <td className="px-4 py-4 text-right text-gray-600">
        {formatCurrency(product.salePrice, productCurrency)}
      </td>
      <td className="px-4 py-4 text-right text-gray-600">
        {formatCurrency(product.minPrice, productCurrency)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onDetails(product)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-purple-600"
            aria-label="Détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600"
            aria-label="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const SearchBar = memo(function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher un produit..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
});

const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
      <Button
        variant="primary"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Précédent
      </Button>
      <span className="text-sm font-semibold text-gray-500">
        Page {currentPage} sur {totalPages}
      </span>
      <Button
        variant="primary"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
      </Button>
    </div>
  );
});

export default function OwnerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getProducts();
      if (result.success && result.data) {
        setProducts(result.data);
        if (result.exchangeRate) {
          setExchangeRate(result.exchangeRate);
        }
        setError(null);
      } else {
        setError(result.error || 'Erreur de chargement');
      }
    });
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter((p) => p.name?.toLowerCase().includes(lower));
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        const newFilteredLen = filteredProducts.length - 1;
        const newTotalPages = Math.ceil(newFilteredLen / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        } else if (newFilteredLen === 0) {
          setCurrentPage(1);
        }
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    },
    [filteredProducts.length, currentPage]
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setEditingProduct(null);
  }, []);

  if ((isLoading && products.length === 0) || exchangeRate === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Chargement des produits et du taux Supabase...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">Erreur : {error}</div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <Card className="border border-gray-100 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-gray-50 pb-4">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Inventaire</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Gestion des produits ({products.length} produits, pagination 6/page)
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 shadow-sm transition-colors"
          >
            Ajouter un produit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <SearchBar value={searchTerm} onChange={handleSearch} />

          {/* Tableau Desktop */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50/75 text-left text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-gray-600">Produit</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-gray-600">Quantité</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600">Prix d&apos;achat</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600">Prix de vente</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600">Prix minimum</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    exchangeRate={exchangeRate}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onDetails={setSelectedProduct}
                  />
                ))}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Aucun produit trouvé dans votre stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cartes Mobile */}
          <div className="grid gap-3 md:hidden">
            {paginatedProducts.map((product) => {
              const productCurrency = product.currency || 'USD';
              return (
                <Card key={product.id} className="border border-gray-200 shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-500">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <QrModeBadge mode={product.qrMode || 'none'} />
                          {product.quantity <= product.stockAlerte && (
                            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                              Stock bas
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">Stock : {product.quantity}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <span className="font-bold text-gray-900">Achat :</span>
                      <span className="text-right font-medium text-gray-700">
                        {formatCurrency(product.purchasePrice, productCurrency)}
                      </span>
                      <span className="font-bold text-gray-900">Vente :</span>
                      <span className="text-right font-medium text-gray-700">
                        {formatCurrency(product.salePrice, productCurrency)}
                      </span>
                      <span className="font-bold text-gray-900">Minimum :</span>
                      <span className="text-right font-medium text-gray-700">
                        {formatCurrency(product.minPrice, productCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)}>
                        Détails
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(product)}>
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <AnimatedSheet isOpen={isSheetOpen} onClose={closeSheet}>
        <div className="p-4">
          <ProductForm
            product={editingProduct}
            onClose={closeSheet}
            exchangeRate={exchangeRate}
          />
        </div>
      </AnimatedSheet>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        exchangeRate={exchangeRate}
      />
    </section>
  );
}