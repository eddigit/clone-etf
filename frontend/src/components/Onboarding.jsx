import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { 
  User, 
  Building2, 
  Store, 
  Briefcase, 
  Users,
  Heart,
  HelpCircle,
  Target,
  Bot,
  Monitor,
  FileText,
  Scale,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles
} from 'lucide-react';
import API from '../config/api';

// Options de statut membre
const MEMBER_STATUS_OPTIONS = [
  { value: 'particulier', label: 'Particulier', icon: User, description: 'Consommateur, citoyen engagé' },
  { value: 'commercant', label: 'Commerçant', icon: Store, description: 'Commerce de détail, boutique' },
  { value: 'artisan', label: 'Artisan', icon: Briefcase, description: 'Artisan indépendant' },
  { value: 'grande_entreprise', label: 'Entreprise', icon: Building2, description: 'PME ou grande entreprise' },
  { value: 'association', label: 'Association', icon: Users, description: 'Association ou collectif' }
];

// Options de taille d'entreprise
const COMPANY_SIZE_OPTIONS = [
  { value: 'solo', label: 'Indépendant' },
  { value: '1-10', label: '1 à 10 employés' },
  { value: '11-50', label: '11 à 50 employés' },
  { value: '50+', label: 'Plus de 50 employés' }
];

// Options de motivations
const MOTIVATION_OPTIONS = [
  { value: 'besoin_aide', label: 'J\'ai besoin d\'aide pour un litige ou une situation difficile', icon: HelpCircle },
  { value: 'soutenir_cause', label: 'Je veux soutenir la cause et les actions de l\'association', icon: Heart },
  { value: 'reseau', label: 'Je cherche à rejoindre un réseau de professionnels', icon: Users },
  { value: 'veille_juridique', label: 'Je veux me tenir informé sur les évolutions juridiques', icon: Scale }
];

// Options d'attentes/services
const EXPECTATION_OPTIONS = [
  { value: 'ia_assistant', label: 'Utiliser l\'assistant IA pour mes questions', icon: Bot },
  { value: 'soutien_numerique', label: 'Bénéficier du soutien numérique (Boîte Digitale)', icon: Monitor },
  { value: 'dossiers', label: 'Être accompagné sur mes dossiers', icon: FileText },
  { value: 'litiges', label: 'Gagner mes litiges avec l\'aide de l\'association', icon: Scale },
  { value: 'formation', label: 'Me former et partager des expériences', icon: GraduationCap }
];

// Options "comment avez-vous connu"
const DISCOVERY_OPTIONS = [
  { value: 'internet', label: 'Recherche internet' },
  { value: 'reseaux_sociaux', label: 'Réseaux sociaux' },
  { value: 'bouche_oreille', label: 'Bouche à oreille' },
  { value: 'presse', label: 'Article de presse' },
  { value: 'partenaire', label: 'Partenaire ou avocat' },
  { value: 'helloasso', label: 'HelloAsso' },
  { value: 'autre', label: 'Autre' }
];

// Secteurs d'activité
const ACTIVITY_SECTORS = [
  'Commerce alimentaire',
  'Restauration / Hôtellerie',
  'Services à la personne',
  'Beauté / Bien-être',
  'Mode / Habillement',
  'Automobile',
  'Immobilier',
  'Santé / Optique',
  'Sport / Loisirs',
  'Technologie / Informatique',
  'Finance / Assurance',
  'Autre'
];

export default function Onboarding({ onComplete, isModal = false }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Slide 1: Profil
    member_status: '',
    activity_sector: '',
    company_size: '',
    
    // Slide 2: Motivations
    motivations: [],
    main_challenges: '',
    
    // Slide 3: Attentes
    expectations: [],
    priority_services: [],
    how_discovered: ''
  });

  const totalSlides = 3;
  const progress = (currentSlide / totalSlides) * 100;

  const handleStatusSelect = (value) => {
    setFormData(prev => ({ ...prev, member_status: value }));
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const canGoNext = () => {
    switch (currentSlide) {
      case 1:
        return formData.member_status !== '';
      case 2:
        return formData.motivations.length > 0;
      case 3:
        return formData.expectations.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canGoNext()) return;
    
    setLoading(true);
    setError('');

    try {
      await API.post('/api/users/onboarding', formData);
      
      if (onComplete) {
        onComplete(formData);
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const renderSlide1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Bienvenue !</h2>
        <p className="text-gray-600 mt-2">
          Aidez-nous à mieux vous connaître pour personnaliser votre expérience
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Quel est votre profil ? *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MEMBER_STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.member_status === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusSelect(option.value)}
                className={`
                  flex items-start p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg mr-3
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-500 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {formData.member_status && formData.member_status !== 'particulier' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-2">
            <Label>Secteur d'activité</Label>
            <Select 
              value={formData.activity_sector}
              onValueChange={(value) => setFormData(prev => ({ ...prev, activity_sector: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre secteur" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_SECTORS.map((sector) => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Taille de l'entreprise</Label>
            <RadioGroup 
              value={formData.company_size}
              onValueChange={(value) => setFormData(prev => ({ ...prev, company_size: value }))}
              className="flex flex-wrap gap-3"
            >
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem value={option.value} id={`size-${option.value}`} />
                  <Label htmlFor={`size-${option.value}`} className="ml-2 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );

  const renderSlide2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Target className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Vos motivations</h2>
        <p className="text-gray-600 mt-2">
          Qu'est-ce qui vous a amené à rejoindre l'association ?
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Pourquoi nous rejoignez-vous ? *</Label>
        <p className="text-sm text-gray-500">Sélectionnez une ou plusieurs raisons</p>
        
        <div className="space-y-3">
          {MOTIVATION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.motivations.includes(option.value);
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleArrayItem('motivations', option.value)}
                className={`
                  w-full flex items-center p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg mr-3
                  ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex-1 font-medium text-gray-900">{option.label}</span>
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'}
                `}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Décrivez votre situation ou vos défis (optionnel)</Label>
        <Textarea
          placeholder="Par exemple: je suis en conflit avec mon franchiseur concernant..."
          value={formData.main_challenges}
          onChange={(e) => setFormData(prev => ({ ...prev, main_challenges: e.target.value }))}
          rows={3}
        />
        <p className="text-xs text-gray-500">
          Ces informations resteront confidentielles et nous aideront à mieux vous accompagner
        </p>
      </div>
    </div>
  );

  const renderSlide3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Vos attentes</h2>
        <p className="text-gray-600 mt-2">
          Quels services souhaitez-vous utiliser ?
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Qu'attendez-vous de l'association ? *</Label>
        <p className="text-sm text-gray-500">Sélectionnez les services qui vous intéressent</p>
        
        <div className="space-y-3">
          {EXPECTATION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.expectations.includes(option.value);
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleArrayItem('expectations', option.value)}
                className={`
                  w-full flex items-center p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg mr-3
                  ${isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex-1 font-medium text-gray-900">{option.label}</span>
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}
                `}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Comment avez-vous connu l'association ?</Label>
        <Select 
          value={formData.how_discovered}
          onValueChange={(value) => setFormData(prev => ({ ...prev, how_discovered: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une option" />
          </SelectTrigger>
          <SelectContent>
            {DISCOVERY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const containerClass = isModal 
    ? 'max-h-[80vh] overflow-y-auto' 
    : 'min-h-screen bg-gray-50 py-12 px-4';

  return (
    <div className={containerClass}>
      <div className={isModal ? '' : 'max-w-2xl mx-auto'}>
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                Étape {currentSlide} sur {totalSlides}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {currentSlide === 1 && renderSlide1()}
            {currentSlide === 2 && renderSlide2()}
            {currentSlide === 3 && renderSlide3()}
            
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentSlide === 1}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>
              
              {currentSlide < totalSlides ? (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canGoNext() || loading}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Terminer
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
