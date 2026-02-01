import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { XCircle, RefreshCcw, Mail } from 'lucide-react';

export default function AdhesionError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full bg-slate-800/50 backdrop-blur border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">
            Paiement non abouti
          </CardTitle>
          <div className="text-xl text-red-400 font-medium">
            Une erreur est survenue
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          <div className="text-center">
            <p className="text-gray-300 text-lg mb-6">
              Nous n'avons pas pu valider votre paiement. Aucune somme n'a été débitée.
              Vous pouvez réessayer ou nous contacter si le problème persiste.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/adhesion')}
              size="lg"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold h-12"
            >
              <RefreshCcw className="ml-2 h-5 w-5" />
              Réessayer
            </Button>

            <Link to="/contact">
              <Button variant="outline" className="w-full text-white border-slate-600 hover:bg-slate-700">
                <Mail className="mr-2 h-4 w-4" />
                Contactez le support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
