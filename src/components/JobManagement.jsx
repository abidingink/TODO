import React, { useState, useEffect, useCallback } from 'react';

const JobManagement = ({ api }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '',
    scheduleType: 'at', // at, every, cron
    atTime: '',
    everyInterval: '3600000', // 1 hour in ms
    cronExpression: '0 9 * * *', // daily at 9am
    timezone: 'Asia/Shanghai',
    payloadType: 'systemEvent', // systemEvent, agentTurn
    message: '',
    enabled: true
  });

  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const jobList = await api.getCronJobs();
      setJobs(jobList);
      setError(null);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load jobs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadJobs();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  // Handle form changes
  const handleInputChange = (field, value) => {
    setNewJob(prev => ({ ...prev, [field]: value }));
  };

  // Add new job
  const addJob = async () => {
    try {
      const job = {
        name: newJob.name,
        schedule: {},
        payload: {},
        sessionTarget: 'main',
        enabled: newJob.enabled
      };

      // Build schedule
      if (newJob.scheduleType === 'at') {
        const atDate = new Date(newJob.atTime);
        job.schedule = {
          kind: 'at',
          atMs: atDate.getTime()
        };
      } else if (newJob.scheduleType === 'every') {
        job.schedule = {
          kind: 'every',
          everyMs: parseInt(newJob.everyInterval)
        };
      } else if (newJob.scheduleType === 'cron') {
        job.schedule = {
          kind: 'cron',
          expr: newJob.cronExpression,
          tz: newJob.timezone
        };
      }

      // Build payload
      if (newJob.payloadType === 'systemEvent') {
        job.payload = {
          kind: 'systemEvent',
          text: newJob.message
        };
      } else if (newJob.payloadType === 'agentTurn') {
        job.payload = {
          kind: 'agentTurn',
          message: newJob.message
        };
      }

      await api.addCronJob(job);
      await loadJobs();
      setShowAddForm(false);
      setNewJob({
        name: '',
        scheduleType: 'at',
        atTime: '',
        everyInterval: '3600000',
        cronExpression: '0 9 * * *',
        timezone: 'Asia/Shanghai',
        payloadType: 'systemEvent',
        message: '',
        enabled: true
      });
    } catch (err) {
      console.error('Failed to add job:', err);
      setError('Failed to add job: ' + err.message);
    }
  };

  // Update job
  const updateJob = async (jobId, updates) => {
    try {
      await api.updateCronJob(jobId, updates);
      await loadJobs();
    } catch (err) {
      console.error('Failed to update job:', err);
      setError('Failed to update job: ' + err.message);
    }
  };

  // Delete job
  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }
    
    try {
      await api.removeCronJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
      setError('Failed to delete job: ' + err.message);
    }
  };

  // Run job immediately
  const runJob = async (jobId) => {
    try {
      await api.runCronJob(jobId);
      alert('Job executed successfully!');
    } catch (err) {
      console.error('Failed to run job:', err);
      setError('Failed to run job: ' + err.message);
    }
  };

  // Format schedule for display
  const formatSchedule = (schedule) => {
    if (!schedule) return 'Unknown';
    
    switch (schedule.kind) {
      case 'at':
        return `One-time: ${new Date(schedule.atMs).toLocaleString()}`;
      case 'every':
        const intervalMinutes = schedule.everyMs / 60000;
        return `Every ${intervalMinutes} minutes`;
      case 'cron':
        return `Cron: ${schedule.expr} (${schedule.tz || 'UTC'})`;
      default:
        return 'Unknown';
    }
  };

  // Format payload for display
  const formatPayload = (payload) => {
    if (!payload) return 'Unknown';
    
    switch (payload.kind) {
      case 'systemEvent':
        return `System Event: ${payload.text?.substring(0, 50)}${payload.text?.length > 50 ? '...' : ''}`;
      case 'agentTurn':
        return `Agent Turn: ${payload.message?.substring(0, 50)}${payload.message?.length > 50 ? '...' : ''}`;
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="job-management">
      <div className="header">
        <h2>Job Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Job'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showAddForm && (
        <div className="add-job-form card">
          <h3>Add New Job</h3>
          
          <div className="form-group">
            <label>Job Name</label>
            <input
              type="text"
              value={newJob.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter job name"
            />
          </div>

          <div className="form-group">
            <label>Schedule Type</label>
            <select
              value={newJob.scheduleType}
              onChange={(e) => handleInputChange('scheduleType', e.target.value)}
            >
              <option value="at">One-time (At specific time)</option>
              <option value="every">Recurring (Every interval)</option>
              <option value="cron">Cron Expression</option>
            </select>
          </div>

          {newJob.scheduleType === 'at' && (
            <div className="form-group">
              <label>Execution Time</label>
              <input
                type="datetime-local"
                value={newJob.atTime}
                onChange={(e) => handleInputChange('atTime', e.target.value)}
              />
            </div>
          )}

          {newJob.scheduleType === 'every' && (
            <div className="form-group">
              <label>Interval (milliseconds)</label>
              <input
                type="number"
                value={newJob.everyInterval}
                onChange={(e) => handleInputChange('everyInterval', e.target.value)}
                min="60000"
                step="60000"
              />
              <small>60000 = 1 minute, 3600000 = 1 hour</small>
            </div>
          )}

          {newJob.scheduleType === 'cron' && (
            <>
              <div className="form-group">
                <label>Cron Expression</label>
                <input
                  type="text"
                  value={newJob.cronExpression}
                  onChange={(e) => handleInputChange('cronExpression', e.target.value)}
                  placeholder="0 9 * * *"
                />
                <small>Format: minute hour day month weekday</small>
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <input
                  type="text"
                  value={newJob.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  placeholder="Asia/Shanghai"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Payload Type</label>
            <select
              value={newJob.payloadType}
              onChange={(e) => handleInputChange('payloadType', e.target.value)}
            >
              <option value="systemEvent">System Event (injects text as system event)</option>
              <option value="agentTurn">Agent Turn (runs agent with message)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Message/Text</label>
            <textarea
              value={newJob.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows="3"
              placeholder="Enter the message or system event text"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={newJob.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
              />
              Enabled
            </label>
          </div>

          <button className="btn-primary" onClick={addJob}>
            Add Job
          </button>
        </div>
      )}

      <div className="jobs-list">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <p>No jobs configured yet.</p>
            <p>Click "Add Job" to create your first automation task.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="job-card card">
              <div className="job-header">
                <h4>{job.name || 'Untitled Job'}</h4>
                <div className="job-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => runJob(job.id)}
                    title="Run now"
                  >
                    ▶️
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => deleteJob(job.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="job-details">
                <div className="job-detail">
                  <strong>Status:</strong>
                  <span className={job.enabled ? 'status-enabled' : 'status-disabled'}>
                    {job.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <div className="job-detail">
                  <strong>Schedule:</strong>
                  <span>{formatSchedule(job.schedule)}</span>
                </div>
                
                <div className="job-detail">
                  <strong>Payload:</strong>
                  <span>{formatPayload(job.payload)}</span>
                </div>
                
                <div className="job-detail">
                  <strong>Session Target:</strong>
                  <span>{job.sessionTarget}</span>
                </div>
              </div>

              <div className="job-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={job.enabled}
                    onChange={(e) => updateJob(job.id, { enabled: e.target.checked })}
                  />
                  Enable/Disable
                </label>
                
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    // TODO: Implement edit functionality
                    alert('Edit functionality coming soon!');
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobManagement;