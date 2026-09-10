'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { History, Clock, User, Package, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 6;

type SaleItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency?: 'USD' | 'CDF';
};

type Sale = {
  id: string;
  created_at: string;
  total_amount: number;
  currency: string;
  seller_id: string | null;
  seller_name?: string;
  items: SaleItem[];
  expanded?: boolean;
  exchange_rate?: number;
  total_amount_fc?: number;
};

type Profile = {
  id: string;
  full_name: string;
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const [defaultRate, setDefaultRate] = useState(2850);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('boutique_id')
          .eq('id', user.id)
          .single();

        if (profile?.boutique_id) {
          const { data: shop } = await supabase
            .from('boutiques')
            .select('exchange_rate')
            .eq('id', profile.boutique_id)
            .single();
          if (shop?.exchange_rate) {
            setDefaultRate(shop.exchange_rate);
          }
        }
      } catch (error) {
        console.error('Erreur de chargement du taux:', error);
      }
    };

    fetchRate();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [defaultRate]);

  const toggleExpand = (saleId: string) => {
    setSales(prev => prev.map(sale =>
      sale.id === saleId ? { ...sale, expanded: !sale.expanded } : sale
    ));
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      if (!salesData || salesData.length === 0) {
        setSales([]);
        setLoading(false);
        return;
      }

      const sellerIds = salesData
        .map(s => s.seller_id)
        .filter((id): id is string => id !== null && id !== undefined);

      let sellerMap: Record<string, string> = {};
      if (sellerIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', sellerIds);

        if (!profileError && profiles) {
          sellerMap = profiles.reduce((acc: Record<string, string>, p: Profile) => {
            acc[p.id] = p.full_name || 'Vendeur inconnu';
            return acc;
          }, {});
        }
      }

      const saleIds = salesData.map(s => s.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .in('sale_id', saleIds);

      if (itemsError) throw itemsError;

      const productIds = itemsData ? itemsData.map(item => item.product_id).filter(Boolean) : [];
      let productMap: Record<string, string> = {};

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        if (!productsError && productsData) {
          productMap = productsData.reduce((acc: Record<string, string>, p: any) => {
            acc[p.id] = p.name || 'Produit inconnu';
            return acc;
          }, {});
        }
      }

      const itemsBySale: Record<string, SaleItem[]> = {};
      if (itemsData) {
        itemsData.forEach((item) => {
          if (!itemsBySale[item.sale_id]) {
            itemsBySale[item.sale_id] = [];
          }

          const productName = productMap[item.product_id] || 'Produit inconnu';
          const currency = item.currency || 'CDF';

          let totalPriceFC = item.total_price || 0;
          if (currency === 'USD') {
            totalPriceFC = item.total_price * defaultRate;
          }

          itemsBySale[item.sale_id].push({
            id: item.id,
            product_name: productName,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total_price: totalPriceFC,
            currency: currency,
          });
        });
      }

      const enrichedSales = salesData.map((sale) => {
        const items = itemsBySale[sale.id] || [];
        let calculatedTotalFC = 0;

        items.forEach(item => {
          calculatedTotalFC += item.total_price;
        });

        const totalFC = calculatedTotalFC > 0 ? calculatedTotalFC : sale.total_amount;

        return {
          ...sale,
          seller_name: sale.seller_id ? (sellerMap[sale.seller_id] || 'Vendeur inconnu') : 'Vendeur inconnu',
          items: items,
          expanded: false,
          exchange_rate: defaultRate,
          total_amount_fc: totalFC,
        };
      });

      setSales(enrichedSales);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des ventes';
      console.error('Erreur détaillée:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'USD') {
      return `${amount.toLocaleString()} $`;
    }
    return `${amount.toLocaleString()} FC`;
  };

  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const paginatedSales = sales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 md:py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-200 border-t-purple-500 animate-spin" />
          <p className="text-xs md:text-sm text-gray-400 font-medium">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 md:p-4">
            <p className="text-sm md:text-base text-red-700">
              <span className="font-medium">⚠️ Erreur :</span> {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 max-w-6xl mx-auto">
      {/* En-tête responsive */}
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="p-1.5 md:p-2 bg-purple-50 rounded-lg md:rounded-xl">
          <Receipt className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">Historique des ventes</h1>
          <p className="text-xs md:text-sm text-gray-500 hidden xs:block">
            Consultez l'historique détaillé de vos transactions
          </p>
        </div>
      </div>

      {sales.length === 0 ? (
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-gray-300" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1">Aucune vente</h3>
            <p className="text-sm text-gray-500">Aucune vente enregistrée pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Version mobile : Cartes */}
          <div className="space-y-2 md:hidden">
            {paginatedSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="p-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleExpand(sale.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {new Date(sale.created_at).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span className="truncate">{sale.seller_name}</span>
                        <span className="text-gray-300">•</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-400 border-gray-200">
                          {sale.items.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm text-purple-700">
                        {formatAmount(sale.total_amount_fc || sale.total_amount, 'CDF')}
                      </div>
                      <button
                        className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label={sale.expanded ? 'Réduire' : 'Développer'}
                      >
                        {sale.expanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {sale.expanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Package className="h-3 w-3" />
                      Produits vendus
                    </p>
                    {sale.items.length > 0 ? (
                      <div className="space-y-1">
                        {sale.items.map((item) => {
                          const total = item.unit_price * item.quantity;
                          const displayCurrency = item.currency === 'USD' ? '$' : 'FC';

                          return (
                            <div key={item.id} className="flex justify-between items-center text-xs">
                              <span className="text-gray-700 truncate max-w-[120px]">{item.product_name}</span>
                              <span className="text-gray-500">× {item.quantity}</span>
                              <span className="font-medium text-gray-800">
                                {total.toLocaleString()} {displayCurrency}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Aucun détail</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Version desktop : Tableau */}
          <div className="hidden md:block">
            <div className="space-y-3">
              {paginatedSales.map((sale) => (
                <Card
                  key={sale.id}
                  className="border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleExpand(sale.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {new Date(sale.created_at).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <User className="h-3.5 w-3.5" />
                          <span>Vendeur : {sale.seller_name}</span>
                          <span className="text-gray-300">•</span>
                          <Badge variant="outline" className="text-xs text-gray-400">
                            {sale.items.length} article{sale.items.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-lg text-purple-700">
                            {formatAmount(sale.total_amount_fc || sale.total_amount, 'CDF')}
                          </div>
                          <div className="text-xs text-gray-400">
                            Taux: {sale.exchange_rate || '?'} FC/$
                          </div>
                        </div>
                        <button
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          aria-label={sale.expanded ? 'Réduire' : 'Développer'}
                        >
                          {sale.expanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {sale.expanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Package className="h-3.5 w-3.5" />
                        Produits vendus
                      </p>
                      {sale.items.length > 0 ? (
                        <div className="space-y-1.5">
                          {sale.items.map((item) => {
                            const total = item.unit_price * item.quantity;
                            const displayCurrency = item.currency === 'USD' ? '$' : 'FC';

                            return (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700">{item.product_name}</span>
                                  {item.currency === 'USD' && (
                                    <Badge variant="outline" className="text-xs text-gray-400">
                                      $
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-gray-600">
                                  <span className="text-xs text-gray-400">× {item.quantity}</span>
                                  <span className="font-medium text-gray-800">
                                    {total.toLocaleString()} {displayCurrency}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Aucun détail de produit disponible</p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 md:mt-6 pt-2">
              <Button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="text-xs md:text-sm px-3 md:px-4"
              >
                ◀ Précédent
              </Button>
              <span className="text-xs md:text-sm text-gray-500 font-medium">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="text-xs md:text-sm px-3 md:px-4"
              >
                Suivant ▶
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}