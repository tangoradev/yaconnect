import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectDetail from '../../components/projects/ProjectDetail';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  return <ProjectDetail projectId={projectId} />;
}

