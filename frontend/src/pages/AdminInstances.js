import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminInstances = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    starting: 0,
    stopped: 0
  });

  useEffect(() => {
    fetchInstances();
    // Refresh every 5 seconds
    const interval = setInterval(fetchInstances, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await api.get('/admin/instances');
      setInstances(response.data);
      
      // Calculate stats
      const stats = response.data.reduce((acc, instance) => {
        acc.total++;
        acc[instance.status] = (acc[instance.status] || 0) + 1;
        return acc;
      }, { total: 0, running: 0, starting: 0, stopped: 0 });
      
      setStats(stats);
    } catch (err) {
      console.error('Error fetching instances:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopInstance = async (instanceId) => {
    if (!window.confirm('Are you sure you want to stop this instance?')) return;

    try {
      await api.delete(`/admin/instances/${instanceId}`);
      fetchInstances(); // Refresh the list
    } catch (err) {
      alert('Failed to stop instance: ' + (err.response?.data?.message || err.message));
    }
  };

  const restartInstance = async (instanceId) => {
    try {
      await api.post(`/admin/instances/${instanceId}/restart`);
      fetchInstances(); // Refresh the list
    } catch (err) {
      alert('Failed to restart instance: ' + (err.response?.data?.message || err.message));
    }
  };

  const stopAllInstances = async () => {
    if (!window.confirm('Are you sure you want to stop ALL instances? This action cannot be undone.')) return;

    try {
      await api.post('/admin/instances/stop-all');
      fetchInstances(); // Refresh the list
    } catch (err) {
      alert('Failed to stop all instances: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'starting':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUptime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  if (loading) return <div className="text-center py-8">Loading instances...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Instance Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchInstances}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
          {instances.length > 0 && (
            <button
              onClick={stopAllInstances}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Stop All
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Instances</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.running}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Starting</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.starting}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stopped</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.stopped}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instances Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Challenge
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uptime
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Container ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {instances.map((instance) => (
              <tr key={instance.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{instance.challenge_name}</div>
                    <div className="text-sm text-gray-500">{instance.challenge_category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{instance.username}</div>
                  <div className="text-sm text-gray-500">{instance.user_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(instance.status)}`}>
                    {instance.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getUptime(instance.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-mono">
                    {instance.container_id ? instance.container_id.substring(0, 12) : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {instance.status === 'running' && (
                      <button
                        onClick={() => restartInstance(instance.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Restart
                      </button>
                    )}
                    <button
                      onClick={() => stopInstance(instance.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Stop
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {instances.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No active instances found.
          </div>
        )}
      </div>

      {/* Access Information */}
      {instances.filter(i => i.access_info).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Instance Access Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {instances
              .filter(i => i.access_info && i.status === 'running')
              .map((instance) => (
                <div key={instance.id} className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-blue-900">{instance.challenge_name}</h3>
                    <span className="text-xs text-blue-600">User: {instance.username}</span>
                  </div>
                  <pre className="text-sm bg-blue-100 p-2 rounded text-blue-800 whitespace-pre-wrap">
                    {instance.access_info}
                  </pre>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInstances;