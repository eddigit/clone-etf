import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2, ArrowRight, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdhesionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    // Launch confetti on mount
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full bg-slate-800/50 backdrop-blur border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">
            Paiement Validé !
          </CardTitle>
          <div className="text-xl text-green-400 font-medium">
            Merci pour votre adhésion
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          <div className="text-center space-y-4">
            <p className="text-gray-300 text-lg">
              Votre soutien est précieux pour l'association En Toute Franchise.
              Vous faites désormais partie de notre communauté engagée.
            </p>

            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
              <h3 className="text-white font-semibold mb-3">Prochaines étapes</h3>
              <ul className="text-left space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <span>Vous allez recevoir un email de confirmation de paiement.</span>
                </li>
                {!isAuthenticated && (
                  <li className="flex items-start gap-3">
                    <div className="min-w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                    <span>Si c'est votre première adhésion, <strong>vérifiez vos emails</strong> : nous vous avons envoyé vos identifiants de connexion.</span>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">{isAuthenticated ? '2' : '3'}</div>
                  <span>Connectez-vous à votre espace membre pour accéder à vos avantages et votre reçu fiscal.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate(userRole === 'admin' ? '/admin' : '/dashboard')}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold h-12"
              >
                Accéder à mon espace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold h-12"
              >
                Se connecter
                <LogIn className="ml-2 h-5 w-5" />
              </Button>
            )}

            <Link to="/">
              <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
