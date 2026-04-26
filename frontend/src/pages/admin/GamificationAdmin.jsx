import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RefreshCw, Save, Plus, X } from 'lucide-react';
import api from '../../services/api';

const tabs = [
  { id: 'rules', label: 'Règles de scoring' },
  { id: 'levels', label: 'Niveaux' },
  { id: 'missions', label: 'Missions' },
  { id: 'badges', label: 'Badges' },
];

export default function GamificationAdmin() {
  const [tab, setTab] = useState('rules');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [rules, setRules] = useState([]);
  const [levels, setLevels] = useState([]);
  const [missions, setMissions] = useState([]);
  const [badgeRules, setBadgeRules] = useState([]);
  const [search, setSearch] = useState('');

  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [missionDraft, setMissionDraft] = useState({
    code: '',
    title: '',
    description: '',
    reward_points: 0,
    is_active: true,
    requirements: '{\n  "actions": [\n    { "action_type": "FORUM_POST_CREATE", "count": 3 }\n  ]\n}',
  });
  const [editingMissionId, setEditingMissionId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        api.get('/admin/gamification/rules'),
        api.get('/admin/gamification/levels'),
        api.get('/admin/gamification/missions'),
        api.get('/admin/gamification/badge-rules'),
      ]);
      setRules((r1.data || []).map((r) => ({ ...r, _dirty: false })));
      setLevels((r2.data || []).map((l) => ({ ...l, _dirty: false })));
      setMissions(r3.data || []);
      setBadgeRules((r4.data || []).map((b) => ({ ...b, _dirty: false })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredRules = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rules;
    return rules.filter((r) => (r.action_type || '').toLowerCase().includes(s));
  }, [rules, search]);

  const filteredMissions = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return missions;
    return missions.filter((m) => (m.code || '').toLowerCase().includes(s) || (m.title || '').toLowerCase().includes(s));
  }, [missions, search]);

  const filteredBadgeRules = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return badgeRules;
    return badgeRules.filter((b) => (b.badge_name || '').toLowerCase().includes(s) || (b.rule_type || '').toLowerCase().includes(s));
  }, [badgeRules, search]);

  const updateRuleField = (id, patch) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r))
    );
  };

  const saveRule = async (rule) => {
    setSavingId(rule.id);
    try {
      const payload = {
        points: Number(rule.points),
        multiplier: Number(rule.multiplier),
        is_active: Boolean(rule.is_active),
        metadata: rule.metadata || {},
      };
      const res = await api.put(`/admin/gamification/rules/${rule.id}`, payload);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...res.data, _dirty: false } : r)));
    } finally {
      setSavingId(null);
    }
  };

  const updateLevelField = (id, patch) => {
    setLevels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch, _dirty: true } : l))
    );
  };

  const saveLevel = async (level) => {
    setSavingId(level.id);
    try {
      const payload = {
        name: level.name,
        min_score: Number(level.min_score),
        sort_order: Number(level.sort_order),
        is_active: Boolean(level.is_active),
      };
      const res = await api.put(`/admin/gamification/levels/${level.id}`, payload);
      setLevels((prev) => prev.map((l) => (l.id === level.id ? { ...res.data, _dirty: false } : l)));
    } finally {
      setSavingId(null);
    }
  };

  const updateBadgeRuleField = (id, patch) => {
    setBadgeRules((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch, _dirty: true } : b))
    );
  };

  const saveBadgeRule = async (rule) => {
    setSavingId(rule.id);
    try {
      const payload = {
        rule_type: rule.rule_type,
        action_type: rule.action_type || null,
        threshold: rule.threshold === null || rule.threshold === undefined || rule.threshold === '' ? null : Number(rule.threshold),
        metadata: rule.metadata || {},
        is_active: Boolean(rule.is_active),
      };
      const res = await api.put(`/admin/gamification/badge-rules/${rule.id}`, payload);
      setBadgeRules((prev) => prev.map((b) => (b.id === rule.id ? { ...res.data, _dirty: false } : b)));
    } finally {
      setSavingId(null);
    }
  };

  const openMissionModal = (mission = null) => {
    if (mission) {
      setEditingMissionId(mission.id);
      setMissionDraft({
        code: mission.code,
        title: mission.title,
        description: mission.description || '',
        reward_points: mission.reward_points || 0,
        is_active: Boolean(mission.is_active),
        requirements: JSON.stringify(mission.requirements || {}, null, 2),
      });
    } else {
      setEditingMissionId(null);
      setMissionDraft({
        code: '',
        title: '',
        description: '',
        reward_points: 10,
        is_active: true,
        requirements: '{\n  "actions": [\n    { "action_type": "FORUM_POST_CREATE", "count": 3 }\n  ]\n}',
      });
    }
    setIsMissionModalOpen(true);
  };

  const saveMission = async (e) => {
    e.preventDefault();
    setSavingId('mission');
    try {
      const req = JSON.parse(missionDraft.requirements || '{}');
      const payload = {
        code: missionDraft.code,
        title: missionDraft.title,
        description: missionDraft.description || null,
        requirements: req,
        reward_points: Number(missionDraft.reward_points || 0),
        is_active: Boolean(missionDraft.is_active),
      };
      if (editingMissionId) {
        const res = await api.put(`/admin/gamification/missions/${editingMissionId}`, payload);
        setMissions((prev) => prev.map((m) => (m.id === editingMissionId ? res.data : m)));
      } else {
        const res = await api.post('/admin/gamification/missions', payload);
        setMissions((prev) => [res.data, ...prev]);
      }
      setIsMissionModalOpen(false);
    } catch {
      alert('Erreur: vérifiez le JSON requirements.');
    } finally {
      setSavingId(null);
    }
  };

  const refreshLeaderboards = async () => {
    setSavingId('refresh');
    try {
      await api.post('/admin/gamification/leaderboards/refresh');
      alert('Leaderboards rafraîchis.');
    } finally {
      setSavingId(null);
    }
  };

  const detectAmbassadors = async () => {
    setSavingId('ambassadors');
    try {
      const res = await api.post('/admin/gamification/ambassadors/detect');
      alert(`Ambassadeurs: éligibles ${res.data.eligible}, sélectionnés ${res.data.selected}, nouveaux badges ${res.data.new}`);
    } finally {
      setSavingId(null);
    }
  };

  const resetPresetsCI = async () => {
    const ok = window.confirm("Réinitialiser les presets Côte d’Ivoire (règles, missions, badges) ?");
    if (!ok) return;
    setSavingId('presets');
    try {
      const res = await api.post('/admin/gamification/presets/ci/reset');
      alert(
        `Presets CI appliqués: ${res.data.levels} niveaux, ${res.data.rules} règles, ${res.data.missions} missions, ${res.data.badges} badges, ${res.data.badge_rules} règles badges.`
      );
      await fetchAll();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 text-brand-orange rounded-lg">
            <Trophy size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gamification</h1>
            <div className="text-sm text-gray-600">Règles, niveaux, missions, automation.</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchAll}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw size={18} className="mr-2" />
            Actualiser
          </button>
          <button
            type="button"
            onClick={resetPresetsCI}
            disabled={savingId === 'presets'}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-60"
          >
            Réinitialiser presets CI
          </button>
          <button
            type="button"
            onClick={refreshLeaderboards}
            disabled={savingId === 'refresh'}
            className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            Rafraîchir leaderboards
          </button>
          <button
            type="button"
            onClick={detectAmbassadors}
            disabled={savingId === 'ambassadors'}
            className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 disabled:opacity-60"
          >
            Détecter ambassadeurs
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                tab === t.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm w-72"
            placeholder="Filtrer par mot-clé..."
          />
          {tab === 'missions' && (
            <button
              type="button"
              onClick={() => openMissionModal()}
              className="flex items-center px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={18} className="mr-2" />
              Nouvelle mission
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-600">Chargement...</div>
        ) : tab === 'rules' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multiplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actif</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sauver</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRules.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{r.action_type}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={r.points}
                        onChange={(e) => updateRuleField(r.id, { points: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.001"
                        value={r.multiplier}
                        onChange={(e) => updateRuleField(r.id, { multiplier: Number(e.target.value) })}
                        className="w-28 px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={Boolean(r.is_active)}
                        onChange={(e) => updateRuleField(r.id, { is_active: e.target.checked })}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={!r._dirty || savingId === r.id}
                        onClick={() => saveRule(r)}
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Save size={16} className="mr-2" />
                        Sauver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'levels' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score min</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actif</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sauver</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {levels.map((l) => (
                  <tr key={l.id}>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={l.name}
                        onChange={(e) => updateLevelField(l.id, { name: e.target.value })}
                        className="w-48 px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={l.min_score}
                        onChange={(e) => updateLevelField(l.id, { min_score: Number(e.target.value) })}
                        className="w-28 px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={l.sort_order}
                        onChange={(e) => updateLevelField(l.id, { sort_order: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={Boolean(l.is_active)}
                        onChange={(e) => updateLevelField(l.id, { is_active: e.target.checked })}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={!l._dirty || savingId === l.id}
                        onClick={() => saveLevel(l)}
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Save size={16} className="mr-2" />
                        Sauver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'missions' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Éditer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMissions.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{m.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{m.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{m.reward_points}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{m.is_active ? 'Oui' : 'Non'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openMissionModal(m)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Règle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actif</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sauver</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBadgeRules.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{b.badge_name || b.badge_id}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={b.rule_type}
                        onChange={(e) => updateBadgeRuleField(b.id, { rule_type: e.target.value })}
                        className="w-44 px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={b.action_type || ''}
                        onChange={(e) => updateBadgeRuleField(b.id, { action_type: e.target.value })}
                        className="w-60 px-2 py-1 border border-gray-200 rounded"
                        placeholder="Optionnel"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={b.threshold ?? ''}
                        onChange={(e) => updateBadgeRuleField(b.id, { threshold: e.target.value })}
                        className="w-24 px-2 py-1 border border-gray-200 rounded"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={Boolean(b.is_active)}
                        onChange={(e) => updateBadgeRuleField(b.id, { is_active: e.target.checked })}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={!b._dirty || savingId === b.id}
                        onClick={() => saveBadgeRule(b)}
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Save size={16} className="mr-2" />
                        Sauver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isMissionModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="font-bold text-gray-900">{editingMissionId ? 'Modifier mission' : 'Nouvelle mission'}</div>
              <button type="button" onClick={() => setIsMissionModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveMission} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Code</label>
                  <input
                    value={missionDraft.code}
                    onChange={(e) => setMissionDraft((p) => ({ ...p, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    disabled={Boolean(editingMissionId)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Bonus points</label>
                  <input
                    type="number"
                    value={missionDraft.reward_points}
                    onChange={(e) => setMissionDraft((p) => ({ ...p, reward_points: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Titre</label>
                <input
                  value={missionDraft.title}
                  onChange={(e) => setMissionDraft((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={missionDraft.description}
                  onChange={(e) => setMissionDraft((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(missionDraft.is_active)}
                  onChange={(e) => setMissionDraft((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Mission active</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Requirements (JSON)</label>
                <textarea
                  rows={8}
                  value={missionDraft.requirements}
                  onChange={(e) => setMissionDraft((p) => ({ ...p, requirements: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMissionModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingId === 'mission'}
                  className="px-4 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  Sauver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
