import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import API from '../config/api';

const MEMBERSHIP_TYPES = {
  individual: {
    label: 'Particuliers',
    minAmount: 10,
    maxAmount: 50,
    description: 'Pour les consommateurs et individus',
    benefits: [
      'Accès aux ressources et retours d\'expérience',
      'Newsletter mensuelle',
      'Participation aux assemblées',
      'Soutien aux actions collectives'
    ]
  },
  professional: {
    label: 'Commerçants - Artisans',
    amount: 50,
    description: 'Pour les professionnels du commerce et de l\'artisanat (moins de 100m²)',
    benefits: [
      'Orientation et accompagnement personnalisé',
      'Accès à l\'assistant IA d\'information',
      'Partage de retours d\'expérience',
      'Orientation vers avocats partenaires',
      'Modèles et ressources documentaires'
    ]
  },
  professional_plus: {
    label: 'Commerçants +100m²',
    amount: 152.32,
    description: 'Pour les commerces de plus de 100m²',
    benefits: [
      'Accompagnement et orientation renforcés',
      'Mise en relation avec avocats partenaires',
      'Veille réglementaire informative',
      'Accès prioritaire au réseau',
      'Formation et partage d\'expérience'
    ]
  },
  association: {
    label: 'Associations',
    amount: 152.32,
    description: 'Pour les associations partenaires',
    benefits: [
      'Partenariat privilégié',
      'Actions et orientations conjointes',
      'Partage de ressources',
      'Coordination des initiatives'
    ]
  }
};

export default function Adhesion() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: choix type, 2: formulaire
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Identité
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    fax: '',
    // Adresse
    adresse_commerciale: '',
    code_postal: '',
    ville: '',
    // Professionnel (pour professional et professional_plus)
    rcs: '',
    type_activite: '',
    activite_detail: '',
    date_creation_commerce: '',
    // Franchise
    is_franchise: false,
    franchise_status: '',
    enseigne: '',
    // Association (pour type association)
    nom_association: '',
    siret: '',
    // Montant (pour individual)
    custom_amount: 10
  });

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Validation de base
    if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    if (!formData.adresse_commerciale || !formData.code_postal || !formData.ville) {
      setError('Veuillez remplir l\'adresse complète');
      return false;
    }

    // Validation code postal
    if (!/^\d{5}$/.test(formData.code_postal)) {
      setError('Le code postal doit contenir 5 chiffres');
      return false;
    }

    // Validation email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email invalide');
      return false;
    }

    // Validations spécifiques selon le type
    if (selectedType === 'professional' || selectedType === 'professional_plus') {
      if (!formData.rcs || !formData.type_activite || !formData.activite_detail || !formData.date_creation_commerce) {
        setError('Veuillez remplir toutes les informations professionnelles');
        return false;
      }
    }

    if (selectedType === 'association') {
      if (!formData.nom_association || !formData.siret) {
        setError('Veuillez remplir les informations de l\'association');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Déterminer le montant
      let amount;
      if (selectedType === 'individual') {
        amount = parseFloat(formData.custom_amount) || 10;
        if (amount < 10 || amount > 50) {
          setError('Le montant pour les particuliers doit être entre 10€ et 50€');
          setLoading(false);
          return;
        }
      } else {
        amount = MEMBERSHIP_TYPES[selectedType].amount;
      }

      // Préparer les données
      const memberData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        fax: formData.fax || null,
        adresse_commerciale: formData.adresse_commerciale,
        code_postal: formData.code_postal,
        ville: formData.ville
      };

      // Ajouter les champs spécifiques selon le type
      if (selectedType === 'professional' || selectedType === 'professional_plus') {
        memberData.rcs = formData.rcs;
        memberData.type_activite = formData.type_activite;
        memberData.activite_detail = formData.activite_detail;
        memberData.date_creation_commerce = formData.date_creation_commerce;
        memberData.is_franchise = formData.is_franchise;
        if (formData.is_franchise) {
          memberData.franchise_status = formData.franchise_status;
          memberData.enseigne = formData.enseigne;
        }
      }

      if (selectedType === 'association') {
        memberData.nom_association = formData.nom_association;
        memberData.siret = formData.siret;
      }

      const payload = {
        membership_type: selectedType,
        amount: amount,
        member_data: memberData
      };

      // Créer l'adhésion
      const response = await API.post('/api/memberships', payload);

      // Rediriger vers HelloAsso pour le paiement
      // TODO: intégrer le lien HelloAsso de paiement
      alert('Adhésion créée avec succès ! Vous allez être redirigé vers le paiement.');
      
      // Pour l'instant, rediriger vers le dashboard
      navigate('/dashboard/adhesions');

    } catch (err) {
      console.error('Erreur lors de la création de l\'adhésion:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création de l\'adhésion');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium mb-4">
              ÉTAPE 1 • OBLIGATOIRE
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choisissez votre type d'adhésion
            </h1>
            <p className="text-lg text-gray-600">
              Sélectionnez le type d'adhésion qui correspond à votre profil
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(MEMBERSHIP_TYPES).map(([key, type]) => {
              const isPopular = key === 'professional';
              
              return (
                <Card 
                  key={key} 
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    isPopular ? 'border-blue-500 border-2' : ''
                  }`}
                  onClick={() => handleTypeSelect(key)}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Le plus populaire
                      </span>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="text-sm text-gray-500 mb-2">
                      {key}
                    </div>
                    <CardTitle className="text-2xl mb-2">
                      {type.label}
                    </CardTitle>
                    <div className="text-3xl font-bold text-gray-900">
                      {type.amount ? (
                        <>{type.amount}€</>
                      ) : (
                        <>{type.minAmount} à {type.maxAmount}€</>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {type.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2">
                      {type.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <Button className="w-full mt-6" variant={isPopular ? "default" : "outline"}>
                      Adhérer
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Étape 2 : Formulaire
  const selectedTypeData = MEMBERSHIP_TYPES[selectedType];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setStep(1)}
          className="mb-6"
        >
          ← Retour au choix du type
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              Formulaire d'adhésion - {selectedTypeData.label}
            </CardTitle>
            <CardDescription>
              Montant : {selectedType === 'individual' ? `${formData.custom_amount}€` : `${selectedTypeData.amount}€`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identité */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Identité</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Coordonnées</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telephone">Téléphone *</Label>
                      <Input
                        id="telephone"
                        name="telephone"
                        type="tel"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fax">Fax</Label>
                      <Input
                        id="fax"
                        name="fax"
                        type="tel"
                        value={formData.fax}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="adresse_commerciale">Adresse *</Label>
                    <Input
                      id="adresse_commerciale"
                      name="adresse_commerciale"
                      value={formData.adresse_commerciale}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="code_postal">Code postal *</Label>
                      <Input
                        id="code_postal"
                        name="code_postal"
                        maxLength={5}
                        pattern="\d{5}"
                        value={formData.code_postal}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="ville">Ville *</Label>
                      <Input
                        id="ville"
                        name="ville"
                        value={formData.ville}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              {(selectedType === 'professional' || selectedType === 'professional_plus') && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Informations professionnelles</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rcs">RCS *</Label>
                        <Input
                          id="rcs"
                          name="rcs"
                          value={formData.rcs}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="type_activite">Type d'activité *</Label>
                        <Select 
                          value={formData.type_activite}
                          onValueChange={(value) => handleSelectChange('type_activite', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commercant">Commerçant</SelectItem>
                            <SelectItem value="artisan">Artisan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="activite_detail">Activité détaillée *</Label>
                        <Input
                          id="activite_detail"
                          name="activite_detail"
                          placeholder="Ex: Boulangerie, Coiffure, etc."
                          value={formData.activite_detail}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_creation_commerce">Date de création du commerce *</Label>
                        <Input
                          id="date_creation_commerce"
                          name="date_creation_commerce"
                          type="date"
                          value={formData.date_creation_commerce}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Franchise */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Franchise</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_franchise"
                          name="is_franchise"
                          checked={formData.is_franchise}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, is_franchise: checked }))
                          }
                        />
                        <Label htmlFor="is_franchise" className="cursor-pointer">
                          Êtes-vous franchisé(e) ?
                        </Label>
                      </div>

                      {formData.is_franchise && (
                        <>
                          <div>
                            <Label htmlFor="franchise_status">Statut franchise *</Label>
                            <Select 
                              value={formData.franchise_status}
                              onValueChange={(value) => handleSelectChange('franchise_status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="actif">Franchisé actif</SelectItem>
                                <SelectItem value="ex">Ex-franchisé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="enseigne">Enseigne *</Label>
                            <Input
                              id="enseigne"
                              name="enseigne"
                              value={formData.enseigne}
                              onChange={handleInputChange}
                              required={formData.is_franchise}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Informations association */}
              {selectedType === 'association' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informations association</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nom_association">Nom de l'association *</Label>
                      <Input
                        id="nom_association"
                        name="nom_association"
                        value={formData.nom_association}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="siret">SIRET *</Label>
                      <Input
                        id="siret"
                        name="siret"
                        value={formData.siret}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Montant pour individual */}
              {selectedType === 'individual' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Montant de l'adhésion</h3>
                  <div>
                    <Label htmlFor="custom_amount">
                      Montant (entre 10€ et 50€) *
                    </Label>
                    <Input
                      id="custom_amount"
                      name="custom_amount"
                      type="number"
                      min="10"
                      max="50"
                      step="0.01"
                      value={formData.custom_amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Erreur */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Bouton */}
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Retour
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading ? 'Création en cours...' : 'Créer mon adhésion'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
