import React, { useEffect, useState } from 'react';
import './ProjectTeamManager.css';
import { fetchProjects, fetchSimpleEmployees, updateProjectTeam } from '../../axios/projectTaskApi';

const ProjectTeamManager = () => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [teamSelection, setTeamSelection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load projects & employees
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [projRes, empRes] = await Promise.all([fetchProjects(), fetchSimpleEmployees()]);
        setProjects(projRes.data.projects || []);
        setEmployees(empRes.data.employees || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load data');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // When project changes, set current teamSelection using employeeId values
  useEffect(() => {
    if (!selectedProjectId) return;
    const p = projects.find(p => p._id === selectedProjectId || p.code === selectedProjectId);
    if (p) {
      const members = (p.teamMembers || []).map(m => m.employeeId);
      setTeamSelection(members);
    }
  }, [selectedProjectId, projects]);

  const toggleMember = (employeeId) => {
    setTeamSelection(prev => prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]);
  };

  const saveTeam = async () => {
    if (!selectedProjectId) return;
    try {
      setSaving(true);
      setError(null); setSuccess(null);
      const project = projects.find(p => p._id === selectedProjectId || p.code === selectedProjectId);
      if (!project) return;
      // map employeeId to _id
      const memberObjectIds = teamSelection.map(eid => employees.find(emp => emp.employeeId === eid)?._id).filter(Boolean);
      await updateProjectTeam(project._id, memberObjectIds);
      // refresh projects list
      const refreshed = await fetchProjects();
      setProjects(refreshed.data.projects || []);
      setSuccess('Team updated successfully');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save team');
    } finally { setSaving(false); }
  };

  const currentProject = projects.find(p => p._id === selectedProjectId || p.code === selectedProjectId);

  return (
    <div className="team-manager">
      <div className="tm-header">
        <h2>Project Team Management</h2>
        <p>Assign or remove employees from project delivery teams.</p>
      </div>
      <div className="tm-controls">
        <label>Select Project:</label>
        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
          <option value="">-- Choose Project --</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
            ))}
        </select>
      </div>
      {loading && <div className="tm-status">Loading data...</div>}
      {error && <div className="tm-error">{error}</div>}
      {success && <div className="tm-success">{success}</div>}
      {currentProject && (
        <>
          <div className="tm-project-meta">
            <div><strong>Client:</strong> {currentProject.client || '—'}</div>
            <div><strong>Status:</strong> {currentProject.status}</div>
            <div><strong>Manager:</strong> {currentProject.manager?.name}</div>
          </div>
          <div className="tm-grid">
            {employees.map(emp => {
              const selected = teamSelection.includes(emp.employeeId);
              return (
                <div key={emp._id} className={`tm-employee-card ${selected ? 'selected' : ''}`} onClick={() => toggleMember(emp.employeeId)}>
                  <div className="tm-emp-initial">{emp.name.charAt(0)}</div>
                  <div className="tm-emp-info">
                    <div className="tm-emp-name">{emp.name}</div>
                    <div className="tm-emp-role">{emp.role}</div>
                    <div className="tm-emp-dept">{emp.department}</div>
                  </div>
                  {selected && <div className="tm-selected-badge">✓</div>}
                </div>
              );
            })}
          </div>
          <div className="tm-actions">
            <button disabled={saving} onClick={saveTeam} className="tm-save-btn">{saving ? 'Saving...' : 'Save Team'}</button>
          </div>
          <div className="tm-current-team">
            <h3>Current Team</h3>
            {(currentProject.teamMembers || []).length === 0 && <div className="tm-empty">No team members assigned.</div>}
            <ul>
              {(currentProject.teamMembers || []).map(m => (
                <li key={m._id}>{m.employeeId} - {m.name}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectTeamManager;
