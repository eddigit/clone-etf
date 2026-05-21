import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowUpRight,
  Search,
  Sparkles,
  Newspaper
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://etf-backend-t3j5.onrender.com';

const Blog = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
    return url;
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ status: 'published', limit: '50' });
        if (selectedCategory) params.append('category', selectedCategory);
        const response = await fetch(`${API_URL}/api/articles?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || []);
        } else {
          setArticles([]);
        }
      } catch (error) {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/articles/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (_) { /* ignore */ }
    };

    fetchArticles();
    fetchCategories();
  }, [selectedCategory]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Filtre par recherche locale
  const filtered = useMemo(() => {
    if (!query.trim()) return articles;
    const q = query.toLowerCase();
    return articles.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.excerpt || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    );
  }, [articles, query]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="etf-article min-h-screen">

      {/* ============================================================
          HERO — éditorial, sobre, accent vert
          ============================================================ */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40" />
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage:
              'radial-gradient(900px 460px at 80% 0%, rgba(16,185,129,0.22) 0%, transparent 60%),' +
              'radial-gradient(700px 360px at 5% 100%, rgba(16,185,129,0.12) 0%, transparent 60%)'
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-24 pb-20 md:pt-32 md:pb-24">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-emerald-300 font-semibold mb-6">
            <span className="h-px w-8 bg-emerald-400/60" />
            Le Journal
            <Sparkles className="h-3 w-3 text-emerald-400/80" />
          </div>

          <h1 className="etf-serif text-4xl md:text-6xl font-medium leading-[1.05] tracking-[-0.025em] text-white mb-6 max-w-3xl">
            Analyses, jurisprudence et terrain pour les commerçants&nbsp;indépendants.
          </h1>

          <p className="text-lg md:text-xl text-stone-300/90 leading-relaxed font-light max-w-2xl mb-10">
            Trente ans de combats juridiques contre les abus de la grande distribution, le tout résumé en articles clairs, sourcés et actionnables.
          </p>

          {/* Recherche */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
              className="w-full bg-white/10 border border-white/15 backdrop-blur-md text-white placeholder-stone-400 rounded-full pl-11 pr-5 py-3 text-sm focus:outline-none focus:border-emerald-400/60 focus:bg-white/15 transition-all"
            />
          </div>
        </div>

        {/* Liaison hero → corps */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-stone-50" style={{
          clipPath: 'ellipse(80% 100% at 50% 100%)'
        }} />
      </section>

      {/* ============================================================
          FILTRES catégorie
          ============================================================ */}
      {categories.length > 0 && (
        <section className="bg-stone-50 border-b border-stone-200/70">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory('')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium uppercase tracking-wider transition-all ${
                  selectedCategory === ''
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:text-stone-900'
                }`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:text-stone-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          GRILLE ARTICLES
          ============================================================ */}
      <section className="bg-stone-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 md:py-20">

          {loading ? (
            <div className="text-center py-16 text-stone-500">
              <div className="inline-flex items-center gap-3">
                <div className="h-4 w-4 rounded-full border-2 border-stone-200 border-t-emerald-500 animate-spin" />
                <span className="text-sm tracking-wide">Chargement…</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-5">
                <Newspaper className="h-6 w-6 text-stone-400" />
              </div>
              <h3 className="etf-serif text-2xl font-medium text-stone-900 mb-2">Aucun article</h3>
              <p className="text-stone-500">
                {query
                  ? `Rien ne correspond à « ${query} ».`
                  : 'Les premiers articles arrivent très bientôt.'}
              </p>
            </div>
          ) : (
            <>
              {/* Article phare */}
              {featured && !selectedCategory && !query && (
                <Link
                  to={`/blog/${featured.slug}`}
                  className="group block mb-16"
                >
                  <div className="grid md:grid-cols-12 gap-7 md:gap-10 items-center">
                    <div className="md:col-span-7">
                      <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-stone-100 ring-1 ring-stone-200/70">
                        {featured.featuredImage ? (
                          <img
                            src={getFullImageUrl(featured.featuredImage)}
                            alt={featured.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-100" />
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-5">
                      <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 mb-4">
                        <span className="h-px w-6 bg-emerald-500" />
                        À la une · {featured.category}
                      </div>
                      <h2 className="etf-serif text-3xl md:text-[2.25rem] leading-[1.12] font-medium text-stone-900 mb-4 group-hover:text-emerald-800 transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-stone-600 leading-relaxed mb-5 line-clamp-3">
                        {featured.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>{formatDate(featured.publishedAt || featured.createdAt)}</span>
                        {featured.readTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {featured.readTime}
                          </span>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1 text-emerald-700 font-medium group-hover:gap-2 transition-all">
                          Lire l'article <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Liste autres articles */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
                {(featured && !selectedCategory && !query ? rest : filtered).map((article) => (
                  <Link
                    to={`/blog/${article.slug}`}
                    key={article.slug || article.id}
                    className="group block"
                  >
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-stone-100 mb-4 ring-1 ring-stone-200/60">
                      {article.featuredImage ? (
                        <img
                          src={getFullImageUrl(article.featuredImage)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200" />
                      )}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 mb-2">
                      {article.category || 'Article'}
                    </div>
                    <h3 className="etf-serif text-xl md:text-[1.35rem] leading-[1.2] font-medium text-stone-900 mb-2.5 group-hover:text-emerald-800 transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-[14px] text-stone-600 leading-relaxed mb-3 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-stone-500">
                      <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                      {article.readTime && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {article.readTime}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ============================================================
          NEWSLETTER — sobre, accent vert
          ============================================================ */}
      <section className="bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-emerald-300 font-semibold mb-5">
            <Sparkles className="h-3 w-3" /> Newsletter
          </div>
          <h2 className="etf-serif text-3xl md:text-4xl font-medium leading-tight mb-3">
            Recevez nos analyses dans votre boîte&nbsp;mail.
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            Une newsletter mensuelle, des décisions de justice décortiquées, zéro spam, on prévient le mois où on n'a rien à dire.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="vous@email.fr"
              className="flex-1 bg-white/5 border border-white/15 text-white placeholder-stone-500 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-emerald-400/60 transition-all"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-3 rounded-full text-sm transition-all inline-flex items-center justify-center gap-1.5"
            >
              S'abonner <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Blog;
