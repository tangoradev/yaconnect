import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { API_ORIGIN } from '../../services/api';

const NewsDetailPage = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const coverUrl = useMemo(() => {
    if (!item?.cover_image_url) return '';
    if (item.cover_image_url.startsWith('http://') || item.cover_image_url.startsWith('https://')) return item.cover_image_url;
    return `${API_ORIGIN}${item.cover_image_url}`;
  }, [item]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/cms/posts/${encodeURIComponent(slug)}`);
        setItem(res.data);
      } catch (e) {
        setItem(null);
        setError(e?.response?.data?.detail || "Publication introuvable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/news" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-brand-orange">
        <ArrowLeft size={18} className="mr-2" />
        Retour aux actualités
      </Link>

      {loading ? (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-8 animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mt-4" />
          <div className="h-4 bg-gray-200 rounded w-full mt-8" />
          <div className="h-4 bg-gray-200 rounded w-11/12 mt-3" />
          <div className="h-4 bg-gray-200 rounded w-10/12 mt-3" />
        </div>
      ) : error ? (
        <div className="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : (
        <article className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          {coverUrl && (
            <img src={coverUrl} alt={item.title} className="w-full h-64 object-cover" />
          )}
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {item.category?.name && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{item.category.name}</span>
              )}
              {(item.tags || []).map((t) => (
                <span key={t.id} className="text-xs bg-orange-50 text-brand-orange px-2 py-0.5 rounded-full">{t.name}</span>
              ))}
              <span className="text-xs text-gray-500 ml-auto">
                {item.published_at ? new Date(item.published_at).toLocaleString() : ''}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
            {item.excerpt && <p className="text-gray-600 mt-4">{item.excerpt}</p>}

            <div className="mt-8 text-gray-800 whitespace-pre-wrap leading-7">
              {item.content || ''}
            </div>
          </div>
        </article>
      )}
    </div>
  );
};

export default NewsDetailPage;

