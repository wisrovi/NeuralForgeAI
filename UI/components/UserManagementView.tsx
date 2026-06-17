import React, { useState } from 'react';
import { User, Plus, Trash2, Edit2, Check, X, Shield, Code } from 'lucide-react';
import { UserProfile } from '../types';

interface UserManagementViewProps {
  users: UserProfile[];
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newMode, setNewMode] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({ role: 'dev' });

  const handleEdit = (user: UserProfile) => {
    setFormData(user);
    setIsEditing(user.id);
    setNewMode(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      onDeleteUser(id);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return;

    if (newMode) {
      const newUser: UserProfile = {
        id: `u-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role || 'dev' as any
      };
      onAddUser(newUser);
    } else if (isEditing) {
      onUpdateUser(formData as UserProfile);
    }

    setNewMode(false);
    setIsEditing(null);
    setFormData({ role: 'dev' });
  };

  const handleCancel = () => {
    setNewMode(false);
    setIsEditing(null);
    setFormData({ role: 'dev' });
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Team Access</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage registered developers and administrators.</p>
        </div>
        {!newMode && !isEditing && (
          <button 
            onClick={() => { setNewMode(true); setFormData({ role: 'dev' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> Add User
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        
        {/* ADD / EDIT FORM ROW */}
        {(newMode || isEditing) && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase mb-4">
              {newMode ? 'Register New User' : 'Edit User'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Email / Handle</label>
                <input 
                  type="text" 
                  value={formData.email || ''} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  placeholder="john@neuroforge.ai"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="dev">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button onClick={handleSave} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                  Save
                </button>
                <button onClick={handleCancel} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIST */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {users.map(user => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                  {user.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{user.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{user.email}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className={`flex items-center gap-1 ${user.role === 'admin' ? 'text-purple-500 font-bold' : ''}`}>
                      {user.role === 'admin' ? <Shield size={10} /> : <Code size={10} />}
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No users found. Add one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;
