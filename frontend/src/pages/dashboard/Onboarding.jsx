import React from 'react';
import { useNavigate } from 'react-router-dom';
import Onboarding from '../../components/Onboarding';

export default function OnboardingPage() {
  const navigate = useNavigate();

  const handleComplete = (data) => {
    console.log('Onboarding completed:', data);
    // Rediriger vers le dashboard après complétion
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="En Toute Franchise Association" 
            className="h-12 mx-auto mb-4"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <p className="text-gray-600">Association nationale de défense des franchisés</p>
        </div>
        
        <Onboarding onComplete={handleComplete} />
      </div>
    </div>
  );
}
