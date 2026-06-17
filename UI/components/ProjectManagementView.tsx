import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Folder, Tag, Calendar } from 'lucide-react';
import { ProjectDefinition } from '../types';

interface ProjectManagementViewProps {
  projects: ProjectDefinition[];
  onAddProject: (project: ProjectDefinition) => void;
  onUpdateProject: (project: ProjectDefinition) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectManagementView: React.FC<ProjectManagementViewProps> = ({ projects, onAddProject, onUpdateProject, onDeleteProject }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newMode, setNewMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectDefinition>>({});

  const handleEdit = (project: ProjectDefinition) => {
    setFormData(project);
    setIsEditing(project.id);
    setNewMode(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project? Existing jobs linked to it will not be deleted.')) {
      onDeleteProject(id);
    }
  };

  const handleSave = () => {
    if (!formData.name) return;

    if (newMode) {
      const newProject: ProjectDefinition = {
        id: `p-${Date.now()}`,
        name: formData.name,
        description: formData.description || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddProject(newProject);
    } else if (isEditing) {
      onUpdateProject(formData as ProjectDefinition);
    }

    setNewMode(false);
    setIsEditing(null);
    setFormData({});
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Project Registry</h2>
          <p className="text-gray-500 dark:text-gray-400">Define experiment namespaces and project groups.</p>
        </div>
        {!newMode && !isEditing && (
          <button 
            onClick={() => { setNewMode(true); setFormData({}); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        
        {/* FORM */}
        {(newMode || isEditing) && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase mb-4">
              {newMode ? 'Create New Project' : 'Edit Project'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium"
                  placeholder="YOLOv8-Experiment-A"
                />
              </div>
              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input 
                  type="text" 
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  placeholder="Brief description of the goal..."
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button onClick={handleSave} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                  Save
                </button>
                <button onClick={() => { setNewMode(false); setIsEditing(null); }} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIST */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {projects.map(project => (
            <div key={project.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Folder size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {project.name}
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono">
                      {project.id}
                    </span>
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>{project.description}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {project.createdAt}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(project)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(project.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No projects defined.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementView;
