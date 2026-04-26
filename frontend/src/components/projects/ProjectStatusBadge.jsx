import React from 'react';

const statusStyles = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  IN_DISCUSSION: 'bg-blue-50 text-blue-700 border-blue-200',
  COMMUNITY_VALIDATION: 'bg-purple-50 text-purple-700 border-purple-200',
  RECOMMENDED: 'bg-green-50 text-green-700 border-green-200',
  AMBASSADOR_PROJECT: 'bg-orange-50 text-orange-700 border-orange-200',
  ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusLabels = {
  DRAFT: 'Brouillon',
  IN_DISCUSSION: 'En discussion',
  COMMUNITY_VALIDATION: 'Validation communautaire',
  RECOMMENDED: 'Recommandé',
  AMBASSADOR_PROJECT: 'Projet Ambassadeur',
  ARCHIVED: 'Archivé',
};

export default function ProjectStatusBadge({ status }) {
  const cls = statusStyles[status] || statusStyles.DRAFT;
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

