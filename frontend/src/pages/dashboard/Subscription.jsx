import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Check, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { aiPlans } from '../../mockData';

const Subscription = () => {
  const currentMembership = {
    type: 'Commerçant - Artisan',
    price: '50€',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active'
  };

  const currentAIPlan = null; // User doesn't have AI plan

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Abonnement</h1>
          <p className="text-gray-600">Gérez votre adhésion et vos plans d'assistance IA</p>
        </div>

        {/* Current Membership */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Adhésion actuelle</CardTitle>
                <CardDescription>Votre statut de membre</CardDescription>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentMembership.type}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prix annuel</span>
                    <span className="font-semibold text-gray-900">{currentMembership.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date de début</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(currentMembership.startDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date d'échéance</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(currentMembership.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Services inclus :</h4>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Conseil & accompagnement</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Assistance administrative</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Conseil stratégique</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Accès aux ressources et modèles</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Support téléphonique prioritaire</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Gérer le paiement
              </Button>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Renouveler
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Plans */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Plans d'Assistance IA</h2>
          <p className="text-gray-600 mb-6">
            {currentAIPlan
              ? 'Votre plan actuel d\'assistance IA'
              : 'Ajoutez l\'assistance IA à votre adhésion'}
          </p>

          {!currentAIPlan && (
            <Card className="bg-yellow-50 border-yellow-200 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Aucun plan IA actif</h3>
                    <p className="text-sm text-yellow-800">
                      Souscrivez à un plan d'assistance IA pour bénéficier de conseils et d'orientation instantanés 24h/24
                      et 7j/7.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {aiPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative hover:shadow-lg transition-shadow ${
                  plan.popular ? 'border-2 border-purple-500' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                    RECOMMANDÉ
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-600">
                      {plan.currency}/{plan.period}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {plan.tokens} tokens + {plan.minutes} minutes/mois
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline" disabled={!plan.available}>
                    {plan.available ? 'Souscrire' : 'Disponible bientôt'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique de facturation</CardTitle>
            <CardDescription>Vos dernières transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: '2025-01-01', description: 'Adhésion Commerçant - Artisan 2025', amount: '50€', status: 'Payé' },
                { date: '2024-01-01', description: 'Adhésion Commerçant - Artisan 2024', amount: '50€', status: 'Payé' }
              ].map((invoice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invoice.description}</p>
                    <p className="text-sm text-gray-600">{new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-900">{invoice.amount}</span>
                    <Badge className="bg-green-100 text-green-700">{invoice.status}</Badge>
                    <Button variant="ghost" size="sm">
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
