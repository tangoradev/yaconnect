import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const CmsPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/cms/pages/${encodeURIComponent(slug)}`);
        setPage(res.data);
      } catch (e) {
        setPage(null);
        setError(e?.response?.data?.detail || "Page introuvable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-brand-orange">
        <ArrowLeft size={18} className="mr-2" />
        Retour à l’accueil
      </Link>

      {loading ? (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-8 animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mt-4" />
          <div className="h-4 bg-gray-200 rounded w-full mt-10" />
          <div className="h-4 bg-gray-200 rounded w-11/12 mt-3" />
          <div className="h-4 bg-gray-200 rounded w-10/12 mt-3" />
        </div>
      ) : error ? (
        <div className="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
          {page.excerpt && <p className="text-gray-600 mt-4">{page.excerpt}</p>}
          <div className="mt-8 text-gray-800 whitespace-pre-wrap leading-7">
            {page.content || ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsPage;

