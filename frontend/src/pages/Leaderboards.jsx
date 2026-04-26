import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LeaderboardChart from '../components/gamification/LeaderboardChart';

const Table = ({ title, rows, columns }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-sm text-gray-500 text-center">
                  Aucune donnée.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-6 py-4 text-sm text-gray-700">
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function Leaderboards() {
  const [contributors, setContributors] = useState([]);
  const [innovators, setInnovators] = useState([]);
  const [regions, setRegions] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [c, i, r, p] = await Promise.all([
        api.get('/leaderboards', { params: { type: 'contributors', period: 'weekly', limit: 10 } }),
        api.get('/leaderboards', { params: { type: 'innovators', period: 'weekly', limit: 10 } }),
        api.get('/leaderboards', { params: { type: 'regions', period: 'daily', limit: 10 } }),
        api.get('/leaderboards', { params: { type: 'projects', period: 'weekly', limit: 10 } }),
      ]);
      setContributors(c.data.items || []);
      setInnovators(i.data.items || []);
      setRegions(r.data.items || []);
      setProjects(p.data.items || []);
    };
    load();
  }, []);

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Classements</h1>
          <p className="mt-2 text-gray-600">Top contributeurs, innovateurs, régions et projets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeaderboardChart type="contributors" period="weekly" title="Top contributeurs (semaine)" />
          <LeaderboardChart type="innovators" period="weekly" title="Top innovateurs (semaine)" />
          <LeaderboardChart type="regions" period="daily" title="Top régions (jour)" />
          <LeaderboardChart type="projects" period="weekly" title="Top projets (semaine)" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Table
            title="Top contributeurs"
            rows={contributors}
            columns={[
              { key: 'rank', label: '#' },
              { key: 'name', label: 'Utilisateur', render: (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.user_id },
              { key: 'points', label: 'Points' },
            ]}
          />
          <Table
            title="Top innovateurs"
            rows={innovators}
            columns={[
              { key: 'rank', label: '#' },
              { key: 'name', label: 'Utilisateur', render: (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.user_id },
              { key: 'points', label: 'Points' },
              { key: 'project_actions', label: 'Actions' },
            ]}
          />
          <Table
            title="Top régions"
            rows={regions}
            columns={[
              { key: 'rank', label: '#' },
              { key: 'region_name', label: 'Région', render: (r) => r.region_name || `Région ${r.region_id}` },
              { key: 'points', label: 'Points' },
            ]}
          />
          <Table
            title="Top projets"
            rows={projects}
            columns={[
              { key: 'rank', label: '#' },
              { key: 'title', label: 'Projet' },
              { key: 'votes', label: 'Votes' },
              { key: 'comments', label: 'Commentaires' },
              { key: 'approval', label: 'Approbation', render: (r) => `${Math.round(r.approval || 0)}%` },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

