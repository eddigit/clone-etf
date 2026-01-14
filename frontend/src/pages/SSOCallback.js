import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import API from '../config/api';

const SSOCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Connexion en cours...');

  useEffect(() => {
    const validateSSO = async () => {
      const token = searchParams.get('token');
      const partner = searchParams.get('partner');

      if (!token || !partner) {
        setStatus('error');
        setMessage('Paramètres SSO manquants');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const response = await API.post('/auth/sso/validate', {
          token,
          partner
        });

        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          setStatus('success');
          setMessage('Connexion réussie ! Redirection...');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          throw new Error(response.data.message || 'Échec de la validation SSO');
        }
      } catch (error) {
        console.error('SSO validation error:', error);
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Erreur lors de la connexion SSO');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    validateSSO();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion SSO</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion réussie !</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de connexion</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirection vers la page de connexion...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SSOCallback;
