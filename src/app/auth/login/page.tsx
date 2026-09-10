'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react'; 
import { GlassCard } from '@/components/ui/GlassCard';
import { loginAction } from '../../../lib/actions/auth';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'owner' | 'employee'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');
  const nextPath = searchParams.get('next') ?? '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      const result = await loginAction(formData);

      if (result?.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
      } else if (result?.success && result?.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setErrorMessage('Réponse inattendue du serveur.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Erreur de connexion au serveur.');
      setIsLoading(false);
    }
  };

  return (
    <GlassCard>
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-4 md:mb-6">
        Bon retour !
      </h1>
      
      {/* ✅ Boutons tabs - version SIMPLE et FIABLE */}
      <div className="flex w-full bg-white/40 p-1 rounded-xl mb-4 md:mb-6 shadow-inner border border-white/50 gap-1">
        <button 
          type="button" 
          onClick={() => setActiveTab('owner')}
          className={`flex-1 py-2.5 text-xs md:text-sm font-bold transition-colors duration-200 rounded-lg min-h-[44px] ${
            activeTab === 'owner' 
              ? 'bg-white text-purple-700 shadow-sm' 
              : 'text-gray-500 hover:bg-white/50'
          }`}
        >
          Propriétaire
        </button>
        
        <button 
          type="button" 
          onClick={() => setActiveTab('employee')}
          className={`flex-1 py-2.5 text-xs md:text-sm font-bold transition-colors duration-200 rounded-lg min-h-[44px] ${
            activeTab === 'employee' 
              ? 'bg-white text-purple-700 shadow-sm' 
              : 'text-gray-500 hover:bg-white/50'
          }`}
        >
          Employé
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 mb-3 md:mb-4 rounded-xl text-xs md:text-sm font-bold text-center bg-red-100 text-red-600 border border-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} method="POST" className="space-y-3 md:space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">
            Email
          </label>
          <input 
            type="email" 
            name="email" 
            required 
            placeholder={activeTab === 'owner' ? "patron@boutique.com" : "employe@boutique.com"} 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-sm md:text-base text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" 
          />
        </div>
        
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">
            Mot de passe
          </label>
          <div className="relative w-full">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              required 
              placeholder="••••••••" 
              className="w-full p-3 pr-12 rounded-xl bg-white/60 border border-white/40 text-sm md:text-base text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" 
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-700 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button 
          disabled={isLoading} 
          type="submit" 
          className={`w-full flex justify-center items-center bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-purple-800 transition-all transform mt-4 disabled:opacity-70 disabled:pointer-events-none min-h-[48px] text-sm md:text-base ${!isLoading ? 'active:scale-95' : ''}`}
        >
          {isLoading ? "CONNEXION EN COURS..." : "SE CONNECTER"}
        </button>
      </form>

      <div className="mt-4 md:mt-6 text-center text-sm">
        <p className="text-gray-600 text-xs md:text-sm">
          {activeTab === 'owner' ? "Nouveau propriétaire ?" : "Nouvel employé ?"}
        </p>
        <Link 
          href={`/auth/register?role=${activeTab}`} 
          className="font-bold text-purple-700 hover:underline inline-block py-2 min-h-[44px] text-sm md:text-base"
        >
          Créer un compte
        </Link>
      </div>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}