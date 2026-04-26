import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../services/api';

const NewsListPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);

  const pageSize = 12;

  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const params = useMemo(() => {
    const p = { skip: (page - 1) * pageSize, limit: pageSize };
    if (q.trim()) p.q = q.trim();
    if (category) p.category = category;
    if (tag) p.tag = tag;
    return p;
  }, [page, q, category, tag]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [catsRes, tagsRes] = await Promise.all([api.get('/cms/categories'), api.get('/cms/tags')]);
        setCategories(catsRes.data || []);
        setTags(tagsRes.data || []);
      } catch {
        setCategories([]);
        setTags([]);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/cms/posts', { params });
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch (e) {
        setItems([]);
        setTotal(0);
        setError(e?.response?.data?.detail || "Impossible de charger les actualités");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params]);

  useEffect(() => {
    setPage(1);
  }, [q, category, tag]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Actualités</h1>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? 'Chargement…' : `${total} publication${total > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
          >
            <option value="">Tous tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-3" />
              <div className="h-4 bg-gray-200 rounded w-full mt-4" />
              <div className="h-4 bg-gray-200 rounded w-5/6 mt-2" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-600">
            Aucune actualité publiée
          </div>
        ) : (
          items.map((p) => (
            <Link
              key={p.id}
              to={`/news/${p.slug}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">{p.title}</h2>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}
                </span>
              </div>
              {p.excerpt ? (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{p.excerpt}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-3 line-clamp-3 whitespace-pre-wrap">{(p.content || '').slice(0, 220)}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {p.category?.name && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{p.category.name}</span>
                )}
                {(p.tags || []).slice(0, 3).map((t) => (
                  <span key={t.id} className="text-xs bg-orange-50 text-brand-orange px-2 py-0.5 rounded-full">{t.name}</span>
                ))}
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          disabled={!canPrev || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
            canPrev && !loading ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Précédent
        </button>
        <div className="text-sm text-gray-600">Page {page}</div>
        <button
          disabled={!canNext || loading}
          onClick={() => setPage((p) => p + 1)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
            canNext && !loading ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default NewsListPage;

