"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchDashboardData, type DashboardData } from "@/lib/actions/dashboardService";
import DashboardKpi from "@/components/DashboardKpi";
import SalesChart from "@/components/SalesChart";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { generateDailyReportPdf } from '@/lib/actions/reports';
import { Button } from "@/components/ui/button";
import { CalendarDays, FileDown } from "lucide-react";

export default function OwnerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchDashboardData();
      setData(result);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await loadData();
      if (isMounted) setLoading(false);
    };
    init();

    const interval = setInterval(() => { loadData(); }, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [loadData]);

  const handleDownloadReport = async () => {
    try {
      const pdfDataUri = await generateDailyReportPdf();
      const a = document.createElement("a");
      a.href = pdfDataUri;
      a.download = `rapport-caisse-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 p-4 md:p-6"><p className="text-gray-600">Chargement...</p></div>;
  if (error) return <div className="min-h-screen bg-gray-50 p-4 md:p-6"><div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl font-bold">Erreur : {error}</div></div>;
  if (!data || !data.dailyRevenue || data.dailyRevenue.length === 0) {
    return <div className="min-h-screen bg-gray-50 p-4 md:p-6"><p className="text-gray-500">Aucune donnée disponible pour le moment.</p></div>;
  }

  const today = data.dailyRevenue[0] || { chiffre_affaires: 0, benefice_net: 0 };
  const rate = data.exchange_rate || 2850;

  const caFC = Number(today.chiffre_affaires) || 0;
  const benefFC = Number(today.benefice_net) || 0;
  const caUSD = caFC / rate;
  const benefUSD = benefFC / rate;

  const last7Days = [...data.dailyRevenue].reverse().slice(-7);
  const caSparkline = last7Days.map(d => Number(d.chiffre_affaires) || 0);
  const benefSparkline = last7Days.map(d => Number(d.benefice_net) || 0);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6 space-y-4 md:space-y-6">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">📊 Tableau de Bord</h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
            {/* Date */}
            <div className="flex items-center h-9 md:h-10 px-2 md:px-3 bg-white rounded-xl border border-gray-200 shadow-sm text-xs md:text-sm text-gray-700 flex-1 sm:flex-none min-w-[140px]">
              <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-500 mr-1.5 md:mr-2 flex-shrink-0" />
              <span className="font-medium truncate">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            {/* Bouton télécharger */}
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleDownloadReport} 
              className="h-9 md:h-10 px-2.5 md:px-4 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm rounded-xl flex-1 sm:flex-none justify-center"
            >
              <FileDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden xs:inline">Télécharger</span>
              <span className="xs:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards - Grille responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <DashboardKpi
            title="💰 Chiffre d'Affaires Global"
            value={`${caFC.toLocaleString()} FC`}
            secondary={`${caUSD.toFixed(2)} $`}
            valueColor="text-green-600"
            progression={data.progressionCA}
            sparklineData={caSparkline}
            sparklineColor="#10B981"
          />
          <DashboardKpi
            title="📈 Bénéfice Net Global"
            value={`${benefFC.toLocaleString()} FC`}
            secondary={`${benefUSD.toFixed(2)} $`}
            valueColor="text-blue-600"
            progression={data.progressionBenefice}
            sparklineData={benefSparkline}
            sparklineColor="#3B82F6"
          />
          <DashboardKpi
            title="🚨 Ruptures"
            value={data.outOfStockCount || 0}
            valueColor="text-red-600"
          />
          <DashboardKpi
            title="💵 Total perçu en USD"
            value={`$${(data.total_usd || 0).toLocaleString()}`}
            valueColor="text-blue-600"
          />
          <DashboardKpi
            title="💵 Total perçu en CDF"
            value={`${(data.total_cdf || 0).toLocaleString()} FC`}
            valueColor="text-green-600"
          />
        </div>

        {/* Graphique */}
        <SalesChart topProducts={data.topProducts || []} />
      </div>
    </NotificationProvider>
  );
}