'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import Image from 'next/image';
import { Search, Minus, Trash2, AlertTriangle, ShoppingCart, Plus, X, ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { getProducts, type Product } from '@/lib/actions/inventory';
import { processSale } from '@/lib/actions/process-sale';
import { findProductByQr } from '@/lib/actions/products';
import { saveToCache, getFromCache } from '@/lib/utils/storage';
import { useRate } from '@/contexts/RateContext';
import QrScanner from '@/components/pos/QrScanner';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 6;

interface ExtendedProduct extends Product {
  sale_price?: number;
  min_price?: number;
}

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  negotiatedPrice: number;
  minPrice: number;
  maxStock: number;
  imageUrl: string | null;
  currency: string;
  qrIds?: string[];
};

const formatPrice = (value: number, currency?: string) => {
  if (currency === 'USD') {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
  }
  return `${Math.round(value).toLocaleString('fr-FR')} FC`;
};

// ---------- SearchBar ----------
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
        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
});

// ---------- Pagination ----------
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
      <Button variant="primary" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Précédent
      </Button>
      <span className="text-sm font-semibold text-gray-600">
        Page {currentPage} sur {totalPages}
      </span>
      <Button variant="primary" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Suivant
      </Button>
    </div>
  );
});

// ---------- Ligne du tableau desktop ----------
const ProductRow = memo(function ProductRow({
  product,
  onAddToCart,
}: {
  product: ExtendedProduct;
  onAddToCart: (product: ExtendedProduct) => void;
}) {
  const rawSalePrice = Number(product.sale_price ?? product.salePrice) || 0;

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-500">📦</div>
            )}
          </div>
          <span className="font-medium text-gray-900">{product.name}</span>
          {product.isLowStock && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              Stock bas
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center text-gray-700">{product.quantity}</td>
      <td className="px-4 py-3 text-right text-gray-700 font-semibold">
        {formatPrice(rawSalePrice, product.currency)}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddToCart(product)}
          disabled={product.quantity === 0}
          className="shrink-0"
          aria-label="Ajouter au panier"
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
});

// ---------- Carte mobile ----------
const MobileProductCard = memo(function MobileProductCard({
  product,
  onAddToCart,
}: {
  product: ExtendedProduct;
  onAddToCart: (product: ExtendedProduct) => void;
}) {
  const rawSalePrice = Number(product.sale_price ?? product.salePrice) || 0;

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-500">📦</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              {product.isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </div>
            <p className="text-sm text-gray-600">Stock : {product.quantity}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <span className="font-bold text-gray-900">Prix vente :</span>
          <span className="text-right font-medium text-gray-700">{formatPrice(rawSalePrice, product.currency)}</span>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onAddToCart(product)} disabled={product.quantity === 0} className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// ---------- Élément du panier ----------
const CartItemRow = memo(function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const total = item.quantity * item.negotiatedPrice;
  const isPriceBelowMin = item.negotiatedPrice < item.minPrice;
  const isQrItem = item.qrIds && item.qrIds.length > 0;

  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs">📦</div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            <p className="text-sm text-gray-600">{formatPrice(item.negotiatedPrice, item.currency)}</p>
            {isQrItem && (
              <p className="text-xs text-purple-600 mt-0.5">
                📷 QR : {item.qrIds?.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5">
          <button
            onClick={() => onRemove(item.id)}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-amber-200 hover:text-red-600"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))} className="rounded-full p-1 hover:bg-amber-200">
              <Minus className="h-3 w-3 text-gray-400" />
            </button>
            <span className="w-8 text-center font-medium text-gray-800">{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.id, Math.min(item.maxStock, item.quantity + 1))} className="rounded-full p-1 hover:bg-amber-200">
              <Plus className="h-3 w-3 text-gray-400" />
            </button>
          </div>
          <div className="w-6" />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total ligne :</span>
          <span className="font-semibold text-gray-900">{formatPrice(total, item.currency)}</span>
        </div>
        {isPriceBelowMin && (
          <p className="text-xs text-red-600">Prix inférieur au minimum autorisé ({formatPrice(item.minPrice, item.currency)})</p>
        )}
      </div>
    </div>
  );
});

// ---------- Page principale ----------
export default function EmployeeSalesPage() {
  const EXCHANGE_RATE = useRate();
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const result = await getProducts();
      if (result.success && result.data) {
        setProducts(result.data);
        saveToCache('products_cache', result.data);
        setError(null);
      } else {
        const cached = getFromCache('products_cache');
        if (cached) setProducts(cached);
        else setError(result.error || 'Erreur de chargement des produits');
      }
      setIsLoading(false);
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(lower));
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

  const handleAddToCart = useCallback((product: ExtendedProduct) => {
    const rawSalePrice = Number(product.sale_price ?? product.salePrice) || 0;
    const rawMinPrice = Number(product.min_price ?? product.minPrice) || 0;
    const currentCurrency = product.currency || 'FC';

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, product.quantity);
        if (newQty === existing.quantity) return prev;
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: newQty } : item));
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          quantity: 1,
          negotiatedPrice: rawSalePrice,
          minPrice: rawMinPrice,
          maxStock: product.quantity,
          imageUrl: product.imageUrl,
          currency: currentCurrency,
        },
      ];
    });
  }, []);

  // ---------- Gestion du scan QR ----------
  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setIsScannerOpen(false);

    try {
      const result = await findProductByQr(decodedText);

      if (!result.success || !result.product) {
        toast.error(result.message || 'Produit introuvable pour ce QR.', {
          style: { borderRadius: '10px', background: '#EF4444', color: '#fff' },
        });
        return;
      }

      const product = result.product as ExtendedProduct;
      const rawSalePrice = Number(product.sale_price ?? product.salePrice) || 0;
      const rawMinPrice = Number(product.min_price ?? product.minPrice) || 0;
      const currentCurrency = product.currency || 'FC';
      const qrId = result.qr_id as string | null;

      setCart((prev) => {
        // Si QR unique → 1 ligne par QR (pas de fusion)
        if (qrId) {
          const existingQr = prev.find((item) => item.qrIds?.includes(qrId));
          if (existingQr) return prev; // déjà dans le panier
          return [
            ...prev,
            {
              id: `${product.id}::${qrId}`,   // ← MODIFICATION 1 : séparateur "::" au lieu de "-"
              name: product.name,
              quantity: 1,
              negotiatedPrice: rawSalePrice,
              minPrice: rawMinPrice,
              maxStock: product.quantity,
              imageUrl: product.imageUrl,
              currency: currentCurrency,
              qrIds: [qrId],
            },
          ];
        }

        // QR modèle ou produit sans QR → comportement classique
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          const newQty = Math.min(existing.quantity + 1, product.quantity);
          return prev.map((item) => (item.id === product.id ? { ...item, quantity: newQty } : item));
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            quantity: 1,
            negotiatedPrice: rawSalePrice,
            minPrice: rawMinPrice,
            maxStock: product.quantity,
            imageUrl: product.imageUrl,
            currency: currentCurrency,
          },
        ];
      });

      toast.success(`${product.name} ajouté au panier`, {
        icon: '✅',
        style: { borderRadius: '10px', background: '#10B981', color: '#fff' },
      });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du scan.', {
        style: { borderRadius: '10px', background: '#EF4444', color: '#fff' },
      });
    }
  }, []);

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(quantity, item.maxStock) } : item))
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const subtotalFc = useMemo(() => {
    return cart.reduce((sum, item) => {
      const priceInFc = item.currency === 'USD' ? item.negotiatedPrice * EXCHANGE_RATE : item.negotiatedPrice;
      return sum + item.quantity * priceInFc;
    }, 0);
  }, [cart, EXCHANGE_RATE]);

  const subtotalUsd = useMemo(() => subtotalFc / EXCHANGE_RATE, [subtotalFc, EXCHANGE_RATE]);
  const hasInvalidPrice = useMemo(() => cart.some((item) => item.negotiatedPrice < item.minPrice), [cart]);
  const hasStockExceed = useMemo(() => cart.some((item) => item.quantity > item.maxStock), [cart]);
  const isCartEmpty = cart.length === 0;

  const handleCheckout = async () => {
    if (!navigator.onLine) {
      alert('Connexion perdue. Vente mise en attente.');
      return;
    }
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let allSuccess = true;
      let errorMessage = '';

      for (const item of cart) {
        // ← MODIFICATION 2 : split sur "::" au lieu de "-"
        const productId = item.qrIds ? item.id.split('::')[0] : item.id;

        const result = await processSale(
          productId,
          item.quantity,
          item.negotiatedPrice,
          item.currency as 'USD' | 'CDF',
          item.qrIds
        );

        if (!result.success) {
          allSuccess = false;
          errorMessage = `${item.name}: ${result.message}`;
          break;
        }
      }

      if (allSuccess) {
        toast.success('Vente finalisée avec succès ! Le stock a été mis à jour.', {
          icon: '🎉',
          style: { borderRadius: '10px', background: '#8B5CF6', color: '#fff', fontWeight: '500' },
        });
        setCart([]);

        const updatedProducts = await getProducts();
        if (updatedProducts && updatedProducts.success && updatedProducts.data) {
          setProducts(updatedProducts.data);
        } else {
          setError(updatedProducts?.error || "Impossible de rafraîchir l'inventaire.");
        }
      } else {
        toast.error(errorMessage, {
          style: { borderRadius: '10px', background: '#EF4444', color: '#fff' },
        });
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Erreur lors de la finalisation :', err);
      toast.error('Une erreur est survenue lors du traitement du panier.', {
        style: { borderRadius: '10px', background: '#EF4444', color: '#fff' },
      });
      setError('Une erreur est survenue lors du traitement du panier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCartSheet = () => setIsSheetOpen(true);
  const closeCartSheet = () => setIsSheetOpen(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Chargement des produits...</div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">Erreur : {error}</div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Ventes</CardTitle>
            <p className="text-sm text-gray-600">Sélectionnez les produits à vendre (pagination 6/page)</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsScannerOpen(true)} variant="outline" size="lg">
              <ScanLine className="mr-2 h-4 w-4" />
              Scanner un QR
            </Button>
            <Button onClick={openCartSheet} className="relative" size="lg">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Panier
              {cart.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-sm text-white">
                  {`(${cart.length})`}
                </span>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBar value={searchTerm} onChange={handleSearch} />

          {/* Version desktop (tableau) */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 text-center font-semibold">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold">Prix de vente</th>
                  <th className="px-4 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <ProductRow key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Aucun produit trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Version mobile (cartes) */}
          <div className="grid gap-3 md:hidden">
            {paginatedProducts.map((product) => (
              <MobileProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
            {paginatedProducts.length === 0 && <p className="py-8 text-center text-gray-500">Aucun produit trouvé</p>}
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </CardContent>
      </Card>

      {/* Panier dans un AnimatedSheet */}
      <AnimatedSheet isOpen={isSheetOpen} onClose={closeCartSheet} side="right" className="max-w-md">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-800">Panier</h2>
            <button onClick={closeCartSheet} className="rounded-full p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-gray-500">Aucun article dans le panier</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItemRow key={item.id} item={item} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              <div className="flex justify-between text-base font-semibold">
                <span className="text-gray-800">Total (FC) :</span>
                <span className="text-gray-900">{formatPrice(subtotalFc, 'FC')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total (USD) :</span>
                <span>{subtotalUsd.toFixed(2)} $</span>
              </div>
              {hasInvalidPrice && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-700 border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  Certains prix sont en dessous du minimum autorisé
                </div>
              )}
              {hasStockExceed && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-700 border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  Quantité supérieure au stock disponible
                </div>
              )}
              {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700 border border-red-200">{error}</div>}
              {successMessage && <div className="rounded-lg bg-green-50 p-2 text-sm text-green-700 border border-green-200">{successMessage}</div>}
              <Button
                variant="primary"
                fullWidth
                onClick={handleCheckout}
                disabled={hasInvalidPrice || hasStockExceed || isCartEmpty || isSubmitting}
              >
                {isSubmitting ? 'Traitement...' : 'Finaliser la vente'}
              </Button>
            </div>
          )}
        </div>
      </AnimatedSheet>

      {/* Modale de scan QR */}
      {isScannerOpen && (
        <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
      )}
    </section>
  );
}