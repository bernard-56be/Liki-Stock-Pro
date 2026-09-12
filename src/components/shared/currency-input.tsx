'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { convertUsdToCdf, convertCdfToUsd } from '@/lib/utils';

interface CurrencyInputProps {
  valueUsd?: number;
  onChange?: (usd: number, cdf: number) => void;
  label?: string;
  disabled?: boolean;
}

export const CurrencyInput = ({
  valueUsd = 0,
  onChange,
  label = 'Prix',
  disabled = false,
}: CurrencyInputProps) => {
  const [rate, setRate] = useState<number | null>(null);
  const [internalValue, setInternalValue] = useState<string | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .single();

      if (profile?.boutique_id) {
        const { data: boutique } = await supabase
          .from('boutiques')
          .select('exchange_rate')
          .eq('id', profile.boutique_id)
          .single();

        if (boutique?.exchange_rate) setRate(boutique.exchange_rate);
      }
    };
    fetchRate();
  }, []);

  const usd = internalValue !== null ? internalValue : valueUsd.toString();

  const handleUsdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      if (rate) {
        const usdNum = parseFloat(e.target.value) || 0;
        const cdfNum = convertUsdToCdf(usdNum, rate);
        onChange?.(usdNum, cdfNum);
      }
    },
    [rate, onChange]
  );

  const handleCdfChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value) || 0;
      if (rate && rate > 0) {
        const newUsd = convertCdfToUsd(val, rate);
        setInternalValue(newUsd.toFixed(2));
        onChange?.(parseFloat(newUsd.toFixed(2)), val);
      }
    },
    [rate, onChange]
  );

  const cdf = rate ? convertUsdToCdf(parseFloat(usd) || 0, rate).toFixed(0) : '';

  if (!rate) {
    return <div className="text-sm text-gray-400">Chargement taux...</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-4">
        <Input
          type="number"
          placeholder="USD"
          value={usd}
          onChange={handleUsdChange}
          disabled={disabled}
          className="flex-1"
          label="USD"
        />
        <Input
          type="number"
          placeholder="CDF"
          value={cdf}
          onChange={handleCdfChange}
          disabled={disabled}
          className="flex-1"
          label="CDF"
        />
      </div>
    </div>
  );
};