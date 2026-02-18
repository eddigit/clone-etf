import React, { useMemo, useCallback, useRef } from 'react';
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
  const quillRef = useRef(null);

  // Insérer une grille d'images via tableau HTML (plus stable dans Quill)
  const insertImageGrid = useCallback((cols) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection(true);
    const index = range ? range.index + range.length : quill.getLength();
    const width = cols === 2 ? '49' : '32';
    const gap = cols === 2 ? '2' : '2';
    const placeholder = 'https://placehold.co/600x400/e2e8f0/64748b?text=Image';
    let cells = '';
    for (let i = 1; i <= cols; i++) {
      const marginRight = i < cols ? `margin-right:${gap}%;` : '';
      cells += `<img src="${placeholder}+${i}" alt="Image ${i}" style="width:${width}%;${marginRight}display:inline-block;vertical-align:top;height:180px;object-fit:cover;border-radius:6px;">`;
    }
    const html = `<p style="font-size:0;line-height:0;white-space:nowrap;">${cells}</p><p><br></p>`;
    quill.clipboard.dangerouslyPasteHTML(index, html);
    quill.setSelection(index + 1, 0);
  }, []);
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

  // Conversion YouTube watch URL → embed URL pour l'aperçu
  const processVideoForPreview = (html) => {
    if (!html) return '<p class="text-gray-400">Aucun contenu à afficher...</p>';
    // Remplacer &nbsp; par espaces normaux
    html = html.replace(/&nbsp;/g, ' ');
    // Convertir iframes ql-video YouTube watch → embed
    html = html.replace(
      /<iframe([^>]*src="(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})[^"]*)"[^>]*)><\/iframe>/gi,
      (match, attrs, watchUrl, videoId) =>
        `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1rem 0">
          <iframe src="https://www.youtube.com/embed/${videoId}?rel=0" 
            style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
            allowfullscreen loading="lazy"></iframe>
        </div>`
    );
    // Convertir iframes ql-video youtu.be → embed
    html = html.replace(
      /<iframe([^>]*src="https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})[^"]*"[^>]*)><\/iframe>/gi,
      (match, attrs, videoId) =>
        `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1rem 0">
          <iframe src="https://www.youtube.com/embed/${videoId}?rel=0"
            style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
            allowfullscreen loading="lazy"></iframe>
        </div>`
    );
    return html;
  };

  // Rendu du contenu HTML pour la prévisualisation
  const renderPreview = () => {
    return (
      <div 
        className="prose prose-lg max-w-none p-4 bg-white rounded-lg article-content"
        dangerouslySetInnerHTML={{ __html: processVideoForPreview(value) }}
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
            {/* Barre grilles d'images */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Grille images :</span>
              <button
                type="button"
                onClick={() => insertImageGrid(2)}
                title="Insérer une grille 2 images côte à côte"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 transition-colors"
              >
                🖼️🖼️ 2 colonnes
              </button>
              <button
                type="button"
                onClick={() => insertImageGrid(3)}
                title="Insérer une grille 3 images côte à côte"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 transition-colors"
              >
                🖼️🖼️🖼️ 3 colonnes
              </button>
              <span className="text-xs text-gray-400 italic">→ insérez 2 ou 3 images dans le même paragraphe pour les afficher côte à côte</span>
            </div>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={value}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              className="rich-text-editor flex-1"
              style={{ 
                height: isFullscreen ? 'calc(100vh - 150px)' : `calc(${minHeight} - 10px)`,
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
