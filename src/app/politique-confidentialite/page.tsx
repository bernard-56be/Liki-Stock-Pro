import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout'

export default function PrivacyPage() {
  return (
    <DashboardClientLayout role="owner" userName="Légal" userAvatar={null} currentRate={0}>
      <div className="max-w-3xl mx-auto p-6 md:p-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
        <p className="mb-4 text-gray-600">Dernière mise à jour : {new Date().getFullYear()}</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Collecte des Informations</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous collectons votre nom, adresse e-mail et numéro de téléphone lors de votre inscription.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Utilisation des Informations</h2>
          <p className="text-gray-700 leading-relaxed">
            Ces informations sont utilisées pour vous fournir un service de qualité.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Partage des Informations</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous ne partageons vos informations personnelles avec aucun tiers.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Sécurité</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous utilisons des mesures de sécurité conformes aux normes de l'industrie.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Vos Droits</h2>
          <p className="text-gray-700 leading-relaxed">
            Vous avez le droit d'accéder, de rectifier ou de supprimer vos données personnelles.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
          <p className="text-gray-700 leading-relaxed">
            Pour toute question relative à cette politique, veuillez nous contacter à support@liki-stock.pro.
          </p>
        </section>
      </div>
    </DashboardClientLayout>
  )
}