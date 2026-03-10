import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllJobs, createJob, updateJob, deleteJob, toggleJobStatus } from '../utils/jobs';
import { Timestamp } from 'firebase/firestore';
import Navbar from './Navbar';
import './PostJob.css';

const PostJob = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    applyLink: '',
    deadline: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const allJobs = await fetchAllJobs();
      setJobs(allJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      type: 'Full-time',
      location: '',
      salary: '',
      description: '',
      requirements: '',
      applyLink: '',
      deadline: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const jobData = {
        title: form.title.trim(),
        type: form.type,
        location: form.location.trim(),
        salary: form.salary.trim(),
        description: form.description.trim(),
        requirements: form.requirements.split('\n').map(r => r.trim()).filter(Boolean),
        applyLink: form.applyLink.trim(),
        deadline: form.deadline ? Timestamp.fromDate(new Date(form.deadline)) : null,
      };

      if (editingId) {
        await updateJob(editingId, jobData);
      } else {
        await createJob(jobData);
      }

      resetForm();
      await loadJobs();
    } catch (err) {
      console.error('Error saving job:', err);
      alert('Failed to save job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (job) => {
    const deadlineVal = job.deadline
      ? (job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline))
          .toISOString().split('T')[0]
      : '';

    setForm({
      title: job.title || '',
      type: job.type || 'Full-time',
      location: job.location || '',
      salary: job.salary || '',
      description: job.description || '',
      requirements: (job.requirements || []).join('\n'),
      applyLink: job.applyLink || '',
      deadline: deadlineVal,
    });
    setEditingId(job.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await deleteJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const handleToggle = async (jobId, currentStatus) => {
    try {
      await toggleJobStatus(jobId, currentStatus);
      await loadJobs();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Navbar />
      <div className="postjob-page">
        <div className="postjob-header">
          <div className="postjob-header-left">
            <h1>Manage Job Postings</h1>
            <p>{jobs.length} job{jobs.length !== 1 ? 's' : ''} total</p>
          </div>
          <div className="postjob-header-actions">
            <button className="postjob-back-btn" onClick={() => navigate('/admin')}>
              ← Back to Admin
            </button>
            {!showForm && (
              <button className="postjob-create-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                + Create Job
              </button>
            )}
          </div>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="postjob-form-card">
            <h2>{editingId ? 'Edit Job' : 'Create New Job'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="postjob-form-grid">
                <div className="postjob-field">
                  <label>Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Graphic & Web Designer"
                    required
                  />
                </div>
                <div className="postjob-field">
                  <label>Job Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div className="postjob-field">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Kathmandu, Nepal"
                  />
                </div>
                <div className="postjob-field">
                  <label>Salary</label>
                  <input
                    type="text"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    placeholder="e.g. Negotiable"
                  />
                </div>
                <div className="postjob-field">
                  <label>Apply Link</label>
                  <input
                    type="url"
                    name="applyLink"
                    value={form.applyLink}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="postjob-field">
                  <label>Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="postjob-field postjob-full">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Brief job description..."
                />
              </div>

              <div className="postjob-field postjob-full">
                <label>Requirements (one per line)</label>
                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Bachelor's degree in BCA, BIM, BIT&#10;Minimum 2 years experience&#10;Familiarity with Adobe Creative Suite"
                />
              </div>

              <div className="postjob-form-actions">
                <button type="button" className="postjob-cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="postjob-save-btn" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Job' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Job Listings */}
        {loading ? (
          <div className="postjob-loading">
            <div className="postjob-spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 && !showForm ? (
          <div className="postjob-empty">
            <p>No job postings yet. Click "Create Job" to add one.</p>
          </div>
        ) : (
          <div className="postjob-list">
            {jobs.map((job) => (
              <div key={job.id} className={`postjob-item ${job.status === 'closed' ? 'postjob-closed' : ''}`}>
                <div className="postjob-item-header">
                  <div>
                    <h3>{job.title}</h3>
                    <div className="postjob-meta">
                      {job.type && <span className="postjob-meta-tag">{job.type}</span>}
                      {job.location && <span className="postjob-meta-text">📍 {job.location}</span>}
                      {job.deadline && <span className="postjob-meta-text">📅 {formatDate(job.deadline)}</span>}
                    </div>
                  </div>
                  <span className={`postjob-status ${job.status}`}>
                    {job.status === 'open' ? '● Open' : '● Closed'}
                  </span>
                </div>

                {job.description && <p className="postjob-item-desc">{job.description}</p>}

                {job.requirements && job.requirements.length > 0 && (
                  <ul className="postjob-item-reqs">
                    {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}

                <div className="postjob-item-actions">
                  <button className="postjob-btn-edit" onClick={() => handleEdit(job)}>
                    ✏️ Edit
                  </button>
                  <button
                    className={`postjob-btn-toggle ${job.status === 'open' ? 'close' : 'open'}`}
                    onClick={() => handleToggle(job.id, job.status)}
                  >
                    {job.status === 'open' ? '🔒 Close' : '🔓 Open'}
                  </button>
                  <button className="postjob-btn-delete" onClick={() => handleDelete(job.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PostJob;
