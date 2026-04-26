import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectWizard from '../../components/projects/ProjectWizard';

export default function ProjectCreate() {
  const navigate = useNavigate();

  const handleCreated = (project) => {
    navigate(`/projects/${project.id}`);
  };

  return <ProjectWizard onCreated={handleCreated} />;
}

