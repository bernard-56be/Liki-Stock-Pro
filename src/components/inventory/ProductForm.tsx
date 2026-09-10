"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { X, Package, QrCode, ScanLine } from "lucide-react";
import { createProduct, updateProduct, type Product } from "@/lib/actions/inventory";

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  exchangeRate: number;
}

type QrMode = 'none' | 'model' | 'unique';

export default function ProductForm({ product, onClose, exchangeRate }: ProductFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);
  const [currency, setCurrency] = useState<"USD" | "CDF">(product?.currency || "USD");
  const [qrMode, setQrMode] = useState<QrMode>(product?.qrMode || 'none');
  const [modelQrCode, setModelQrCode] = useState<string>(product?.modelQrCode || '');
  const [uniqueQrCodes, setUniqueQrCodes] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const [purchasePrice, setPurchasePrice] = useState<string>(
    product?.purchasePrice ? product.purchasePrice.toString() : ""
  );
  const [salePrice, setSalePrice] = useState<string>(
    product?.salePrice ? product.salePrice.toString() : ""
  );
  const [minPrice, setMinPrice] = useState<string>(
    product?.minPrice ? product.minPrice.toString() : ""
  );

  const isEditing = !!product;

  const handleCurrencyChange = (newCurrency: "USD" | "CDF") => {
    if (newCurrency === currency) return;
    const convert = (valueStr: string) => {
      const num = parseFloat(valueStr);
      if (isNaN(num)) return "";
      if (newCurrency === "CDF") {
        return Math.round(num * exchangeRate).toString();
      } else {
        const convertedUSD = Math.round((num / exchangeRate) * 100) / 100;
        return convertedUSD.toString();
      }
    };
    setPurchasePrice(convert(purchasePrice));
    setSalePrice(convert(salePrice));
    setMinPrice(convert(minPrice));
    setCurrency(newCurrency);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop volumineuse et ne doit pas dépasser 5 Mo.");
        e.target.value = '';
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    formData.append("currency", currency);
    formData.append("qr_mode", qrMode);

    if (qrMode === 'model') {
      formData.append("model_qr_code", modelQrCode);
    }
    if (qrMode === 'unique') {
      formData.append("unique_qr_codes", uniqueQrCodes);
    }

    if (isEditing && product) {
      formData.append("id", product.id);
      if (product.imageUrl) formData.append("currentImageUrl", product.imageUrl);
    }

    startTransition(async () => {
      const action = isEditing ? updateProduct : createProduct;
      const result = await action(formData);
      if (result.success) {
        onClose();
        window.location.reload();
      } else {
        alert(result.error || "Une erreur est survenue lors de l'enregistrement.");
      }
    });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditing ? "Modifier l'article" : "Nouvel Article"}
        </h2>
        <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 flex-1 overflow-y-auto pr-1">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du produit</label>
          <input
            name="name"
            type="text"
            placeholder="Ex: Côte de porc..."
            defaultValue={product?.name || ""}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Quantité initiale</label>
          <input
            name="quantity"
            type="number"
            defaultValue={product?.quantity ?? 0}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          />
        </div>

        {/* --- Sélecteur de mode QR --- */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Type de suivi</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQrMode('none')}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-semibold transition ${
                qrMode === 'none'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Package className="h-5 w-5" />
              Sans QR
            </button>
            <button
              type="button"
              onClick={() => setQrMode('model')}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-semibold transition ${
                qrMode === 'model'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <QrCode className="h-5 w-5" />
              QR Modèle
            </button>
            <button
              type="button"
              onClick={() => setQrMode('unique')}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-semibold transition ${
                qrMode === 'unique'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <ScanLine className="h-5 w-5" />
              QR Unique
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 italic">
            {qrMode === 'none' && "Produit classique, aucun suivi par code QR."}
            {qrMode === 'model' && "Un même code QR pour tout le stock (produits identiques)."}
            {qrMode === 'unique' && "Un code QR par article (numéros de série, lots)."}
          </p>
        </div>

        {/* Champ QR modèle */}
        {qrMode === 'model' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Code QR du modèle</label>
            <input
              type="text"
              value={modelQrCode}
              onChange={(e) => setModelQrCode(e.target.value)}
              placeholder="Ex: MODELE-CIMENT-50KG"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </div>
        )}

        {/* Champ QR uniques */}
        {qrMode === 'unique' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Codes QR uniques (un par ligne)
            </label>
            <textarea
              value={uniqueQrCodes}
              onChange={(e) => setUniqueQrCodes(e.target.value)}
              rows={5}
              placeholder={"SN-0001\nSN-0002\nSN-0003"}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {uniqueQrCodes.split('\n').filter((c) => c.trim()).length} code(s) saisi(s)
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Devise de fixation du prix</label>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => handleCurrencyChange("USD")}
              className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
                currency === "USD" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => handleCurrencyChange("CDF")}
              className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
                currency === "CDF" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              FC (CDF)
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 italic">
            Taux appliqué : 1 $ = {exchangeRate} FC
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Prix d'achat de base</label>
          <div className="relative rounded-lg border border-gray-200 overflow-hidden">
            <input
              name="purchasePrice"
              type="number"
              step="any"
              placeholder="0.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
              {currency}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Prix de vente de base</label>
          <div className="relative rounded-lg border border-gray-200 overflow-hidden">
            <input
              name="salePrice"
              type="number"
              step="any"
              placeholder="0.00"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
              {currency}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Prix de vente minimum autorisé</label>
          <div className="relative rounded-lg border border-gray-200 overflow-hidden">
            <input
              name="minPrice"
              type="number"
              step="any"
              placeholder="0.00"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
              {currency}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Stock minimum (Alerte rupture)</label>
          <input
            name="min_stock"
            type="number"
            defaultValue={product?.stockAlerte ?? 5}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Image du produit</label>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-purple-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
          />
          {previewUrl && (
            <div className="mt-3 flex justify-start">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                <Image src={previewUrl} alt="Aperçu" fill className="object-cover" />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors disabled:bg-purple-300"
        >
          {isPending ? "Enregistrement en cours..." : "Enregistrer le produit"}
        </button>
      </form>
    </div>
  );
}