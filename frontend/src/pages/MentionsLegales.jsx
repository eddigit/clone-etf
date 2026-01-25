import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Scale, Lock, Mail, Phone, MapPin } from 'lucide-react';

const MentionsLegales = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mentions Légales</h1>
          </div>
          <p className="text-gray-600">
            Informations légales et conditions d'utilisation du site de l'Association EN TOUTE FRANCHISE
          </p>
        </div>

        {/* Publication du site */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Publication du site
          </h2>

          {/* 1. Éditeur du site */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Éditeur du site</h3>
            <div className="text-gray-700 space-y-3">
              <p>
                Le site internet <strong>Association EN TOUTE FRANCHISE</strong>, accessible à l'adresse{' '}
                <a href="https://en-toutefranchise.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  https://en-toutefranchise.com
                </a>, est édité par :
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-gray-900 mb-3">Association EN TOUTE FRANCHISE</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>1 rue François Boucher – 13700 Marignane</span>
                  </div>
                  <p>Association déclarée à la Sous-Préfecture d'Istres sous le numéro <strong>W134002644</strong></p>
                  <p>Numéro SIRET : <strong>932 901 044</strong></p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>06 09 78 09 53</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <a href="mailto:assoentoutefranchise@sfr.fr" className="text-blue-600 hover:underline">
                      assoentoutefranchise@sfr.fr
                    </a>
                  </div>
                </div>
              </div>

              <div id="mission" className="mt-4 space-y-2 text-sm scroll-mt-24">
                <p className="font-semibold text-gray-900">Mission de l'Association (Objet Statutaire)</p>
                <p>
                  L'Association EN TOUTE FRANCHISE, apolitique depuis 1994, a pour mission de :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Lutter contre l'implantation abusive des grandes surfaces</li>
                  <li>Défendre les intérêts collectifs des commerçants indépendants et artisans</li>
                  <li>Protéger le cadre de vie et l'aménagement du territoire</li>
                  <li>Faire respecter les droits fondamentaux des professionnels (droit au bail commercial, droit d'investir, droit de créer son emploi, droit de transmettre son entreprise)</li>
                  <li>Combattre la concurrence déloyale et les pratiques commerciales illégales</li>
                  <li>Assurer le respect de la légalité devant les juridictions judiciaires, administratives et pénales</li>
                </ul>
              </div>

              <p className="mt-4">
                L'accès et l'utilisation du site sont soumis aux présentes conditions générales d'utilisation (CGU), qui ont pour objet de définir le cadre juridique applicable.
              </p>
              <p>
                L'accès au site implique l'acceptation pleine et entière des CGU par l'utilisateur. 
                Celles-ci sont applicables à compter de leur mise en ligne et peuvent être modifiées à tout moment par l'Association EN TOUTE FRANCHISE, sans préavis.
              </p>
            </div>
          </section>

          {/* 2. Responsable de la publication */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Responsable de la publication</h3>
            <p className="text-gray-700">
              La responsabilité de la publication est assurée par : <strong>Martine DONNETTE</strong>, Présidente de l'Association EN TOUTE FRANCHISE.
            </p>
          </section>

          {/* 3. Hébergement */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Hébergement</h3>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
              <div>
                <p className="font-semibold text-gray-900 mb-2">Nom de domaine</p>
                <div className="text-gray-700 text-sm space-y-1">
                  <p><strong>Online SAS (Scaleway)</strong></p>
                  <p>8 rue de la Ville l'Évêque</p>
                  <p>75008 Paris, France</p>
                  <p>Site web : <a href="https://www.online.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.online.net</a></p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Hébergement de l'application</p>
                <div className="text-gray-700 text-sm space-y-1">
                  <p><strong>Vercel Inc.</strong></p>
                  <p>340 S Lemon Ave #4133</p>
                  <p>Walnut, CA 91789, États-Unis</p>
                  <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vercel.com</a></p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Responsabilité */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Responsabilité</h3>
            <div className="text-gray-700 space-y-3">
              <p>
                Les informations diffusées sur le site sont communiquées à titre informatif. 
                L'Association EN TOUTE FRANCHISE s'efforce d'en assurer l'exactitude, mais ne saurait garantir qu'elles soient complètes, exactes ou à jour.
              </p>
              <p>
                L'Association EN TOUTE FRANCHISE décline toute responsabilité en cas d'erreurs, d'omissions, de modifications ou d'indisponibilité du site, ainsi qu'en cas de dommages, directs ou indirects, résultant de l'accès ou de l'utilisation du site.
              </p>
              <p>
                L'Association EN TOUTE FRANCHISE n'est pas soumise à une obligation générale de surveillance des contenus diffusés sur le site. 
                Elle s'engage toutefois à retirer tout contenu manifestement illicite qui lui serait signalé conformément aux dispositions de la loi pour la confiance dans l'économie numérique (LCEN).
              </p>
              <p>
                Les liens hypertextes présents sur le site peuvent renvoyer vers des sites tiers. 
                L'Association EN TOUTE FRANCHISE ne saurait être tenue responsable du contenu ou du fonctionnement de ces sites externes.
              </p>
              <p>
                L'utilisateur est seul responsable de l'usage qu'il fait du site et des conséquences pouvant en découler. 
                Il répond de tout dommage causé à des tiers ou à l'Association EN TOUTE FRANCHISE du fait d'une utilisation non conforme du site.
              </p>
            </div>
          </section>

          {/* 5. Propriété intellectuelle */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Propriété intellectuelle</h3>
            <div className="text-gray-700 space-y-3">
              <p>
                L'ensemble des éléments composant le site (textes, images, graphismes, logos, sons, vidéos, animations, etc.) est protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive de l'Association EN TOUTE FRANCHISE.
              </p>
              <p>
                Toute reproduction, représentation, modification ou diffusion, totale ou partielle, de ces éléments, sans autorisation écrite préalable de l'Association EN TOUTE FRANCHISE, est strictement interdite conformément à l'article L.122-4 du Code de la propriété intellectuelle.
              </p>
              <p>
                Toute violation de ces dispositions constitue une contrefaçon susceptible d'engager la responsabilité civile et pénale de son auteur, conformément aux articles L.335-2 et suivants du Code de la propriété intellectuelle.
              </p>
            </div>
          </section>

          {/* 6. Engagements de l'utilisateur */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Engagements de l'utilisateur</h3>
            <div className="text-gray-700 space-y-3">
              <p>
                Tout contenu publié par l'utilisateur, notamment sous forme de commentaires, relève de sa seule responsabilité.
              </p>
              <p>
                L'utilisateur s'engage à ne pas diffuser de contenus illicites, diffamatoires, injurieux, portant atteinte à la vie privée, aux droits des tiers, aux bonnes mœurs ou à l'ordre public.
              </p>
              <p>
                L'utilisateur reconnaît être responsable de son accès à internet et ne pourra tenir l'Association EN TOUTE FRANCHISE pour responsable des dommages résultant de l'impossibilité d'accéder au site.
              </p>
            </div>
          </section>
        </div>

        {/* RGPD */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lock className="h-6 w-6 text-blue-600" />
            Règlement général sur la protection des données (RGPD)
          </h2>

          {/* 1. Données personnelles collectées */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Données personnelles collectées</h3>
            <div className="text-gray-700 space-y-3">
              <p>
                L'Association EN TOUTE FRANCHISE est susceptible de traiter les données personnelles communiquées volontairement par les utilisateurs, notamment :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Données d'identification (nom, prénom, titre)</li>
                <li>Coordonnées (adresse postale, adresse électronique, numéro de téléphone)</li>
                <li>Informations administratives (numéro SIRET, RCS, numéro d'adhérent, nationalité)</li>
              </ul>
              <p>
                Les utilisateurs s'engagent à ne transmettre que des données les concernant et à ne pas communiquer d'informations relatives à des tiers.
              </p>
            </div>
          </section>

          {/* 2. Finalités et bases légales */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Finalités et bases légales du traitement</h3>
            <div className="text-gray-700 space-y-4">
              <p>Les données personnelles sont traitées par l'Association EN TOUTE FRANCHISE pour les finalités suivantes :</p>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">a) Consentement de l'utilisateur</h4>
                <p className="mb-2">Après accord explicite de l'utilisateur, les données sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Répondre aux demandes de contact</li>
                  <li>Transmettre des informations relatives aux activités de l'Association EN TOUTE FRANCHISE</li>
                  <li>Améliorer le fonctionnement interne, les services proposés et le site internet</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">b) Intérêt légitime</h4>
                <p>
                  Les données peuvent également être traitées afin d'assurer la protection des intérêts, droits et activités de l'Association EN TOUTE FRANCHISE, des utilisateurs ou de tiers, notamment dans le cadre du respect des conditions d'utilisation et de procédures judiciaires.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">c) Exécution d'un contrat</h4>
                <p>
                  Dans le cadre de l'adhésion à l'Association EN TOUTE FRANCHISE, les données sont nécessaires à la gestion administrative, comptable et relationnelle des adhérents, ainsi qu'au traitement des réclamations.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">d) Obligations légales</h4>
                <p>
                  Certaines données sont conservées afin de satisfaire aux obligations légales, comptables et fiscales applicables à l'Association EN TOUTE FRANCHISE.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Sous-traitance */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Sous-traitance et garanties</h3>
            <div className="text-gray-700 space-y-3">
              <p>
                Les données personnelles peuvent être confiées à des sous-traitants lorsque cela est nécessaire à la réalisation des missions confiées.
              </p>
              <p>
                Ces sous-traitants agissent exclusivement sur instruction de l'Association EN TOUTE FRANCHISE, dans le respect d'un engagement contractuel de confidentialité et en mettant en œuvre toutes les mesures de sécurité appropriées pour garantir la protection des données.
              </p>
            </div>
          </section>

          {/* 4. Durée de conservation */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Durée de conservation</h3>
            <p className="text-gray-700">
              Les données personnelles sont conservées pendant une durée strictement nécessaire à la réalisation des finalités poursuivies. 
              En principe, cette durée n'excède pas trois ans, sauf obligation légale imposant une conservation plus longue.
            </p>
          </section>

          {/* 5. Sécurité */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Sécurité des données</h3>
            <div className="text-gray-700 space-y-3">
              <p>
                L'Association EN TOUTE FRANCHISE met en place des mesures techniques et organisationnelles adaptées afin de garantir la confidentialité et la sécurité des données personnelles et de prévenir tout accès ou usage non autorisé.
              </p>
              <p>
                En cas de violation des données personnelles, l'Association EN TOUTE FRANCHISE s'engage à en informer l'autorité compétente conformément à la réglementation en vigueur.
              </p>
            </div>
          </section>

          {/* 6. Droits des utilisateurs */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Droits des utilisateurs</h3>
            <div className="text-gray-700 space-y-3">
              <p>Conformément à la réglementation applicable, les utilisateurs disposent des droits suivants :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Droit d'accès</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité</li>
                <li>Droit d'opposition, notamment pour des motifs légitimes ou à des fins de prospection</li>
                <li>Droit de ne pas faire l'objet d'une décision fondée exclusivement sur un traitement automatisé</li>
                <li>Droit d'introduire une réclamation auprès de l'autorité de contrôle compétente</li>
              </ul>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Exercer vos droits</p>
                <p>
                  Ces droits peuvent être exercés par courrier électronique, accompagné d'une copie d'une pièce d'identité, à l'adresse suivante :
                </p>
                <a 
                  href="mailto:assoentoutefranchise@sfr.fr" 
                  className="text-blue-600 hover:underline font-medium flex items-center gap-2 mt-2"
                >
                  <Mail className="h-4 w-4" />
                  assoentoutefranchise@sfr.fr
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Réseaux sociaux */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Réseaux sociaux</h2>
          <div className="text-gray-700 space-y-3">
            <p>
              L'Association EN TOUTE FRANCHISE est présente sur les réseaux sociaux, notamment Facebook.
            </p>
            <p>
              L'utilisation de ces plateformes est soumise à leurs propres conditions d'utilisation.
            </p>
          </div>
        </div>

        {/* Droit applicable */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Droit applicable</h2>
          <div className="text-gray-700 space-y-3">
            <p>
              Les présentes conditions générales d'utilisation sont soumises au droit français.
            </p>
            <p>
              Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence des juridictions françaises.
            </p>
          </div>
        </div>

        {/* Retour */}
        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;
