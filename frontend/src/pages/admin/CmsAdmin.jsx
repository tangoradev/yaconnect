import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2, Upload, RotateCcw } from 'lucide-react';
import api, { API_ORIGIN } from '../../services/api';

const toLocalInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
  const local = new Date(d.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
};

const fromLocalInputValue = (value) => {
  if (!value) return null;
  return value;
};

const StatusPill = ({ status }) => {
  const styles = status === 'PUBLISHED'
    ? 'bg-green-100 text-green-800'
    : status === 'ARCHIVED'
      ? 'bg-gray-200 text-gray-800'
      : 'bg-yellow-100 text-yellow-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>;
};

const CmsAdmin = () => {
  const [tab, setTab] = useState('posts');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [media, setMedia] = useState([]);

  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);

  const [postForm, setPostForm] = useState({
    id: null,
    title: '',
    slug: '',
    status: 'DRAFT',
    published_at: '',
    category_id: '',
    tag_ids: [],
    excerpt: '',
    cover_image_url: '',
    content: '',
  });

  const [pageForm, setPageForm] = useState({
    id: null,
    title: '',
    slug: '',
    status: 'DRAFT',
    published_at: '',
    excerpt: '',
    content: '',
  });

  const [revisions, setRevisions] = useState([]);

  const selectedEntity = useMemo(() => {
    if (tab === 'posts' && selectedPostId) return { type: 'POST', id: selectedPostId };
    if (tab === 'pages' && selectedPageId) return { type: 'PAGE', id: selectedPageId };
    return null;
  }, [tab, selectedPostId, selectedPageId]);

  const loadAllMeta = async () => {
    const [catsRes, tagsRes] = await Promise.all([api.get('/admin/cms/categories'), api.get('/admin/cms/tags')]);
    setCategories(catsRes.data || []);
    setTags(tagsRes.data || []);
  };

  const loadPosts = async () => {
    const res = await api.get('/admin/cms/posts');
    setPosts(res.data || []);
  };

  const loadPages = async () => {
    const res = await api.get('/admin/cms/pages');
    setPages(res.data || []);
  };

  const loadMedia = async () => {
    const res = await api.get('/admin/cms/media');
    setMedia(res.data || []);
  };

  const loadRevisions = async (entityType, entityId) => {
    const res = await api.get('/admin/cms/revisions', { params: { entity_type: entityType, entity_id: entityId } });
    setRevisions(res.data || []);
  };

  const refresh = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await Promise.all([loadAllMeta(), loadPosts(), loadPages(), loadMedia()]);
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de rafraîchir le CMS");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedEntity) {
      setRevisions([]);
      return;
    }
    loadRevisions(selectedEntity.type, selectedEntity.id).catch(() => setRevisions([]));
  }, [selectedEntity]);

  useEffect(() => {
    if (!selectedPostId) return;
    const p = posts.find((x) => x.id === selectedPostId);
    if (!p) return;
    setPostForm({
      id: p.id,
      title: p.title || '',
      slug: p.slug || '',
      status: p.status || 'DRAFT',
      published_at: toLocalInputValue(p.published_at),
      category_id: p.category_id ?? '',
      tag_ids: p.tag_ids || [],
      excerpt: p.excerpt || '',
      cover_image_url: p.cover_image_url || '',
      content: p.content || '',
    });
  }, [selectedPostId, posts]);

  useEffect(() => {
    if (!selectedPageId) return;
    const p = pages.find((x) => x.id === selectedPageId);
    if (!p) return;
    setPageForm({
      id: p.id,
      title: p.title || '',
      slug: p.slug || '',
      status: p.status || 'DRAFT',
      published_at: toLocalInputValue(p.published_at),
      excerpt: p.excerpt || '',
      content: p.content || '',
    });
  }, [selectedPageId, pages]);

  const createNewPost = () => {
    setSelectedPostId(null);
    setPostForm({
      id: null,
      title: '',
      slug: '',
      status: 'DRAFT',
      published_at: '',
      category_id: '',
      tag_ids: [],
      excerpt: '',
      cover_image_url: '',
      content: '',
    });
  };

  const createNewPage = () => {
    setSelectedPageId(null);
    setPageForm({
      id: null,
      title: '',
      slug: '',
      status: 'DRAFT',
      published_at: '',
      excerpt: '',
      content: '',
    });
  };

  const savePost = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        title: postForm.title,
        slug: postForm.slug || null,
        status: postForm.status,
        published_at: fromLocalInputValue(postForm.published_at),
        category_id: postForm.category_id === '' ? null : Number(postForm.category_id),
        tag_ids: postForm.tag_ids,
        excerpt: postForm.excerpt || null,
        cover_image_url: postForm.cover_image_url || null,
        content: postForm.content || '',
      };
      let res;
      if (postForm.id) {
        res = await api.put(`/admin/cms/posts/${postForm.id}`, payload);
      } else {
        res = await api.post('/admin/cms/posts', payload);
      }
      await loadPosts();
      setSelectedPostId(res.data.id);
      setNotice('Article sauvegardé');
      if (res.data?.id) await loadRevisions('POST', res.data.id);
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de sauvegarder l’article");
    } finally {
      setBusy(false);
    }
  };

  const deletePost = async () => {
    if (!postForm.id) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/cms/posts/${postForm.id}`);
      await loadPosts();
      createNewPost();
      setNotice('Article supprimé');
      setRevisions([]);
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de supprimer l’article");
    } finally {
      setBusy(false);
    }
  };

  const savePage = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        title: pageForm.title,
        slug: pageForm.slug || null,
        status: pageForm.status,
        published_at: fromLocalInputValue(pageForm.published_at),
        excerpt: pageForm.excerpt || null,
        content: pageForm.content || '',
      };
      let res;
      if (pageForm.id) {
        res = await api.put(`/admin/cms/pages/${pageForm.id}`, payload);
      } else {
        res = await api.post('/admin/cms/pages', payload);
      }
      await loadPages();
      setSelectedPageId(res.data.id);
      setNotice('Page sauvegardée');
      if (res.data?.id) await loadRevisions('PAGE', res.data.id);
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de sauvegarder la page");
    } finally {
      setBusy(false);
    }
  };

  const deletePage = async () => {
    if (!pageForm.id) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/cms/pages/${pageForm.id}`);
      await loadPages();
      createNewPage();
      setNotice('Page supprimée');
      setRevisions([]);
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de supprimer la page");
    } finally {
      setBusy(false);
    }
  };

  const toggleTag = (tagId) => {
    setPostForm((f) => {
      const has = f.tag_ids.includes(tagId);
      return { ...f, tag_ids: has ? f.tag_ids.filter((x) => x !== tagId) : [...f.tag_ids, tagId] };
    });
  };

  const initDefaults = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await api.post('/admin/cms/init');
      await refresh();
      setNotice(`Initialisation OK (catégories: ${res.data.categories}, tags: ${res.data.tags}, pages: ${res.data.pages})`);
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible d’initialiser le CMS");
    } finally {
      setBusy(false);
    }
  };

  const createCategory = async (name) => {
    const n = (name || '').trim();
    if (!n) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.post('/admin/cms/categories', { name: n });
      await loadAllMeta();
      setNotice('Catégorie créée');
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de créer la catégorie");
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/cms/categories/${id}`);
      await loadAllMeta();
      setNotice('Catégorie supprimée');
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de supprimer la catégorie");
    } finally {
      setBusy(false);
    }
  };

  const createTag = async (name) => {
    const n = (name || '').trim();
    if (!n) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.post('/admin/cms/tags', { name: n });
      await loadAllMeta();
      setNotice('Tag créé');
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de créer le tag");
    } finally {
      setBusy(false);
    }
  };

  const deleteTag = async (id) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/cms/tags/${id}`);
      await loadAllMeta();
      setNotice('Tag supprimé');
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de supprimer le tag");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = new FormData();
      data.append('file', file);
      await api.post('/admin/cms/media', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadMedia();
      setNotice('Image envoyée');
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible d’envoyer l’image");
    } finally {
      setBusy(false);
    }
  };

  const restoreRevision = async (revisionId) => {
    if (!revisionId || !selectedEntity) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.post(`/admin/cms/revisions/${revisionId}/restore`);
      if (selectedEntity.type === 'POST') await loadPosts();
      if (selectedEntity.type === 'PAGE') await loadPages();
      await loadRevisions(selectedEntity.type, selectedEntity.id);
      setNotice('Révision restaurée');
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de restaurer la révision");
    } finally {
      setBusy(false);
    }
  };

  const mediaUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    return `${API_ORIGIN}${fileUrl}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CMS</h1>
          <p className="text-sm text-gray-600">Pages, actualités, taxonomies, médias et révisions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={initDefaults}
            disabled={busy}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <RotateCcw size={18} className="mr-2" />
            Initialiser
          </button>
          <button
            onClick={refresh}
            disabled={busy}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw size={18} className="mr-2" />
            Rafraîchir
          </button>
        </div>
      </div>

      {(notice || error) && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {error || notice}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3 flex flex-wrap gap-2">
          {[
            { key: 'posts', label: 'Articles' },
            { key: 'pages', label: 'Pages' },
            { key: 'categories', label: 'Catégories' },
            { key: 'tags', label: 'Tags' },
            { key: 'media', label: 'Médias' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === t.key ? 'bg-orange-50 text-brand-orange' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-0">
            <div className="xl:col-span-4 border-b xl:border-b-0 xl:border-r border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Articles</div>
                <button
                  onClick={createNewPost}
                  className="inline-flex items-center px-3 py-2 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 text-sm font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Nouveau
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto">
                {posts.length === 0 ? (
                  <div className="px-4 pb-6 text-sm text-gray-600">Aucun article</div>
                ) : (
                  posts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPostId(p.id)}
                      className={`w-full text-left px-4 py-3 border-t border-gray-100 hover:bg-gray-50 ${
                        selectedPostId === p.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900 truncate">{p.title}</div>
                        <StatusPill status={p.status} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">/{p.slug}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="xl:col-span-5 border-b xl:border-b-0 xl:border-r border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">{postForm.id ? 'Édition' : 'Création'}</div>
                <div className="flex gap-2">
                  <button
                    onClick={savePost}
                    disabled={busy || !postForm.title.trim()}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      busy || !postForm.title.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-blue/90'
                    }`}
                  >
                    <Save size={18} className="mr-2" />
                    Sauver
                  </button>
                  <button
                    onClick={deletePost}
                    disabled={busy || !postForm.id}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      busy || !postForm.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Trash2 size={18} className="mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      value={postForm.title}
                      onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      value={postForm.slug}
                      onChange={(e) => setPostForm((f) => ({ ...f, slug: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      placeholder="auto si vide"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    >
                      <option value="DRAFT">Brouillon</option>
                      <option value="PUBLISHED">Publié</option>
                      <option value="ARCHIVED">Archivé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date publication</label>
                    <input
                      type="datetime-local"
                      value={postForm.published_at}
                      onChange={(e) => setPostForm((f) => ({ ...f, published_at: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                      value={postForm.category_id}
                      onChange={(e) => setPostForm((f) => ({ ...f, category_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    >
                      <option value="">Aucune</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Image couverture</label>
                    <input
                      value={postForm.cover_image_url}
                      onChange={(e) => setPostForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      placeholder="/static/cms/…"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Extrait</label>
                  <textarea
                    value={postForm.excerpt}
                    onChange={(e) => setPostForm((f) => ({ ...f, excerpt: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contenu</label>
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm((f) => ({ ...f, content: e.target.value }))}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange font-mono text-sm"
                  />
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => {
                      const active = postForm.tag_ids.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTag(t.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                            active ? 'bg-orange-50 border-orange-200 text-brand-orange' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">Révisions</div>
                <div className="text-xs text-gray-500 mt-1">Sauvegarde automatique avant chaque modification</div>
              </div>
              <div className="px-4 pb-6 max-h-[65vh] overflow-y-auto">
                {selectedEntity ? (
                  revisions.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucune révision</div>
                  ) : (
                    <div className="space-y-2">
                      {revisions.map((r) => (
                        <div key={r.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-600">
                              {new Date(r.created_at).toLocaleString()}
                            </div>
                            <button
                              onClick={() => restoreRevision(r.id)}
                              disabled={busy}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                                busy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              Restaurer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-sm text-gray-600">Sélectionne un article pour voir les révisions</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'pages' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-0">
            <div className="xl:col-span-4 border-b xl:border-b-0 xl:border-r border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Pages</div>
                <button
                  onClick={createNewPage}
                  className="inline-flex items-center px-3 py-2 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 text-sm font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Nouveau
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto">
                {pages.length === 0 ? (
                  <div className="px-4 pb-6 text-sm text-gray-600">Aucune page</div>
                ) : (
                  pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPageId(p.id)}
                      className={`w-full text-left px-4 py-3 border-t border-gray-100 hover:bg-gray-50 ${
                        selectedPageId === p.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900 truncate">{p.title}</div>
                        <StatusPill status={p.status} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">/{p.slug}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="xl:col-span-5 border-b xl:border-b-0 xl:border-r border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">{pageForm.id ? 'Édition' : 'Création'}</div>
                <div className="flex gap-2">
                  <button
                    onClick={savePage}
                    disabled={busy || !pageForm.title.trim()}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      busy || !pageForm.title.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-blue/90'
                    }`}
                  >
                    <Save size={18} className="mr-2" />
                    Sauver
                  </button>
                  <button
                    onClick={deletePage}
                    disabled={busy || !pageForm.id}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      busy || !pageForm.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Trash2 size={18} className="mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      value={pageForm.title}
                      onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      value={pageForm.slug}
                      onChange={(e) => setPageForm((f) => ({ ...f, slug: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      placeholder="auto si vide"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={pageForm.status}
                      onChange={(e) => setPageForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    >
                      <option value="DRAFT">Brouillon</option>
                      <option value="PUBLISHED">Publié</option>
                      <option value="ARCHIVED">Archivé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date publication</label>
                    <input
                      type="datetime-local"
                      value={pageForm.published_at}
                      onChange={(e) => setPageForm((f) => ({ ...f, published_at: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Extrait</label>
                  <textarea
                    value={pageForm.excerpt}
                    onChange={(e) => setPageForm((f) => ({ ...f, excerpt: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contenu</label>
                  <textarea
                    value={pageForm.content}
                    onChange={(e) => setPageForm((f) => ({ ...f, content: e.target.value }))}
                    rows={14}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">Révisions</div>
                <div className="text-xs text-gray-500 mt-1">Sauvegarde automatique avant chaque modification</div>
              </div>
              <div className="px-4 pb-6 max-h-[65vh] overflow-y-auto">
                {selectedEntity ? (
                  revisions.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucune révision</div>
                  ) : (
                    <div className="space-y-2">
                      {revisions.map((r) => (
                        <div key={r.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-600">
                              {new Date(r.created_at).toLocaleString()}
                            </div>
                            <button
                              onClick={() => restoreRevision(r.id)}
                              disabled={busy}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                                busy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              Restaurer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-sm text-gray-600">Sélectionne une page pour voir les révisions</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <TaxoPanel
            title="Catégories"
            items={categories}
            onCreate={createCategory}
            onDelete={deleteCategory}
            busy={busy}
          />
        )}

        {tab === 'tags' && (
          <TaxoPanel
            title="Tags"
            items={tags}
            onCreate={createTag}
            onDelete={deleteTag}
            busy={busy}
          />
        )}

        {tab === 'media' && (
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Médias</div>
                <div className="text-xs text-gray-500 mt-1">Upload images (WEBP) et réutilisation dans les articles</div>
              </div>
              <label className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                busy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-blue/90'
              }`}>
                <Upload size={18} className="mr-2" />
                Envoyer une image
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  className="hidden"
                  onChange={(e) => uploadImage(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {media.length === 0 ? (
                <div className="col-span-full text-sm text-gray-600">Aucun média</div>
              ) : (
                media.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPostForm((f) => ({ ...f, cover_image_url: m.file_url }))}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm hover:border-gray-300 transition-all bg-white"
                    title="Cliquer pour définir comme image de couverture"
                  >
                    <img src={mediaUrl(m.file_url)} alt={m.id} className="w-full h-24 object-cover" />
                    <div className="p-2 text-[11px] text-gray-600 truncate">{m.file_url}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TaxoPanel = ({ title, items, onCreate, onDelete, busy }) => {
  const [name, setName] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await onCreate(name);
    setName('');
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500 mt-1">Gestion des {title.toLowerCase()}</div>
        </div>
        <form onSubmit={submit} className="flex gap-2 w-full md:w-auto">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Nouveau ${title.slice(0, -1).toLowerCase()}…`}
            className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              busy || !name.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-orange text-white hover:bg-brand-orange/90'
            }`}
          >
            <Plus size={18} className="mr-2" />
            Ajouter
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-600">
                  Aucun élément
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{it.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{it.slug}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => onDelete(it.id)}
                      disabled={busy}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                        busy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <Trash2 size={18} className="mr-2" />
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CmsAdmin;

