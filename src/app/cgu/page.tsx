import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout'

export default function CguPage() {
  return (
    <DashboardClientLayout
      role="owner"
      userName="Légal"
      userAvatar={null}
      currentRate={0}
    >
      <div className="max-w-3xl mx-auto p-6 md:p-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Conditions Générales d'Utilisation (CGU)</h1>
        <p className="mb-4 text-gray-600">Dernière mise à jour : {new Date().getFullYear()}</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Acceptation des Conditions</h2>
          <p className="text-gray-700 leading-relaxed">
            En utilisant Liki-Stock Pro, vous acceptez pleinement les présentes conditions générales d'utilisation.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Description du Service</h2>
          <p className="text-gray-700 leading-relaxed">
            Liki-Stock Pro est une application de gestion de stock et de point de vente destinée aux commerçants.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Obligations de l'Utilisateur</h2>
          <p className="text-gray-700 leading-relaxed">
            L'utilisateur s'engage à fournir des informations exactes lors de son inscription.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Protection des Données</h2>
          <p className="text-gray-700 leading-relaxed">
            Les données de votre boutique sont strictement confidentielles.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Limitation de Responsabilité</h2>
          <p className="text-gray-700 leading-relaxed">
            Liki-Stock Pro ne saurait être tenu responsable des pertes financières résultant de l'utilisation du service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Modification des CGU</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous nous réservons le droit de modifier ces conditions à tout moment.
          </p>
        </section>
      </div>
    </DashboardClientLayout>
  )
}