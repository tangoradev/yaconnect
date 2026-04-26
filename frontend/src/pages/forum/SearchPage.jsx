import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../services/api';
import SearchBar from '../../components/forum/SearchBar';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      fetchResults();
    }
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/forum/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (error) {
      console.error("Failed to search", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Recherche</h1>
        <SearchBar />
      </div>

      {loading ? (
        <div className="text-center py-8">Recherche en cours...</div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {results.length} résultats pour "{query}"
          </h2>
          
          {results.map((result) => (
            <div key={`${result.type}-${result.id}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                  result.type === 'topic' ? 'bg-purple-100 text-purple-700' : 
                  result.type === 'post' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {result.type}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
              <Link 
                to={result.type === 'topic' ? `/forum/topic/${result.id}` : `/forum/post/${result.id}`}
                className="block group"
              >
                <h3 className="font-bold text-gray-900 group-hover:text-brand-orange transition-colors">
                  {result.title || "Discussion"}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {result.content}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
