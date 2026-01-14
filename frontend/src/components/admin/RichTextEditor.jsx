import React, { useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './RichTextEditor.css';
import { Button } from '../ui/button';
import { Eye, Code, Maximize2, Minimize2 } from 'lucide-react';

/**
 * Éditeur de texte riche premium pour la création d'articles
 * Fonctionnalités : 
 * - Mise en forme avancée (gras, italique, souligné, barré)
 * - Titres H1, H2, H3
 * - Couleurs de texte et de fond
 * - Liens cliquables
 * - Listes à puces et numérotées
 * - Citations
 * - Images et vidéos
 * - Alignement du texte
 * - Indentation
 * - Tableaux
 */

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Écrivez votre article ici...",
  minHeight = "400px",
  showPreview = true 
}) => {
  const [isPreview, setIsPreview] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('editor'); // 'editor', 'preview', 'split'

  // Configuration des modules de l'éditeur
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        // Titres
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        
        // Styles de police
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        
        // Mise en forme de base
        ['bold', 'italic', 'underline', 'strike'],
        
        // Couleurs
        [{ 'color': [
          '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
          '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
          '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
          '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
          '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466',
          '#1a1a1a', '#330000', '#331f00', '#333300', '#001f00', '#001433', '#1f0a33'
        ]}, { 'background': [
          '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
          '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
          '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
          '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
          '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466',
          'transparent'
        ]}],
        
        // Scripts
        [{ 'script': 'sub'}, { 'script': 'super' }],
        
        // Listes et indentation
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        
        // Alignement
        [{ 'align': [] }],
        [{ 'direction': 'rtl' }],
        
        // Blocs spéciaux
        ['blockquote', 'code-block'],
        
        // Liens et médias
        ['link', 'image', 'video'],
        
        // Nettoyage
        ['clean']
      ],
      handlers: {
        // Les handlers par défaut de Quill gèrent tout
      }
    },
    clipboard: {
      matchVisual: false
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  }), []);

  // Formats supportés
  const formats = useMemo(() => [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'check',
    'indent',
    'align', 'direction',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'clean'
  ], []);

  // Gestionnaire de changement
  const handleChange = useCallback((content, delta, source, editor) => {
    onChange(content);
  }, [onChange]);

  // Rendu du contenu HTML pour la prévisualisation
  const renderPreview = () => {
    return (
      <div 
        className="prose prose-lg max-w-none p-4 bg-white rounded-lg article-content"
        dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">Aucun contenu à afficher...</p>' }}
      />
    );
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-white flex flex-col" 
    : "relative";

  return (
    <div className={containerClasses}>
      {/* Barre d'outils supérieure */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border border-b-0 rounded-t-md">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Mode d'affichage :</span>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'editor' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Éditer
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-sm font-medium border-x transition-colors ${
                viewMode === 'split' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
              }`}
            >
              Divisé
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'preview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Aperçu
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Zone d'édition */}
      <div className={`flex ${isFullscreen ? 'flex-1' : ''}`} style={{ minHeight: isFullscreen ? 'calc(100vh - 60px)' : minHeight }}>
        {/* Éditeur */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 border-r' : 'w-full'} flex flex-col`}>
            <ReactQuill
              theme="snow"
              value={value}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              className="rich-text-editor flex-1"
              style={{ 
                height: isFullscreen ? 'calc(100vh - 120px)' : `calc(${minHeight} - 10px)`,
              }}
            />
          </div>
        )}

        {/* Prévisualisation */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto bg-gray-50 border rounded-b-md`}>
            <div className="p-2 bg-gray-100 border-b">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Aperçu de l'article
              </span>
            </div>
            <div className="p-4 bg-white min-h-full">
              {renderPreview()}
            </div>
          </div>
        )}
      </div>

      {/* Conseils d'utilisation */}
      <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Conseils pour un article premium</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Utilisez des <strong>titres (H2, H3)</strong> pour structurer votre contenu</li>
          <li>• Ajoutez des <strong>couleurs</strong> pour mettre en avant les informations importantes</li>
          <li>• Insérez des <strong>liens cliquables</strong> vers des ressources externes</li>
          <li>• Utilisez des <strong>citations</strong> pour les témoignages ou références</li>
          <li>• Alternez <strong>texte et images</strong> pour une meilleure lisibilité</li>
          <li>• Utilisez le mode <strong>Divisé</strong> pour voir le rendu en temps réel</li>
        </ul>
      </div>
    </div>
  );
};

export default RichTextEditor;
