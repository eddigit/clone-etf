import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdhesionCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full bg-slate-800/50 backdrop-blur border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 border border-yellow-500/30">
            <AlertCircle className="h-10 w-10 text-yellow-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">
            Paiement annulé
          </CardTitle>
          <div className="text-xl text-yellow-400 font-medium">
            Vous avez annulé l'opération
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          <div className="text-center">
            <p className="text-gray-300 text-lg mb-6">
              Le processus de paiement a été interrompu. Vous pouvez reprendre votre adhésion à tout moment.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/adhesion')}
              size="lg"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold h-12"
            >
              <ArrowLeft className="ml-2 h-5 w-5" />
              Retour aux adhésions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
