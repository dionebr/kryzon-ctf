import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalChallenges: 0,
    solvedChallenges: 0,
    totalPoints: 0,
    userRank: 0
  });
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [activeInstances, setActiveInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, challengesRes, instancesRes] = await Promise.all([
        api.get('/user/stats'),
        api.get('/challenges?limit=5'),
        api.get('/instances/active')
      ]);

      setStats(statsRes.data);
      setRecentChallenges(challengesRes.data);
      setActiveInstances(instancesRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopInstance = async (instanceId) => {
    try {
      await api.delete(`/instances/${instanceId}`);
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert('Failed to stop instance: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
        <p className="text-gray-600">Here's your CTF progress overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solved Challenges</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.solvedChallenges}/{stats.totalChallenges}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Instances</p>
              <p className="text-2xl font-semibold text-gray-900">{activeInstances.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Your Rank</p>
              <p className="text-2xl font-semibold text-gray-900">#{stats.userRank || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Challenges */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Challenges</h2>
            <Link to="/challenges" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentChallenges.slice(0, 5).map((challenge) => (
              <div key={challenge.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <Link 
                    to={`/challenges/${challenge.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {challenge.name}
                  </Link>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {challenge.difficulty}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">{challenge.points} pts</span>
                  </div>
                </div>
                {challenge.solved && (
                  <span className="text-green-500 text-xs font-medium">✓ Solved</span>
                )}
              </div>
            ))}
          </div>

          {recentChallenges.length === 0 && (
            <p className="text-gray-500 text-center py-4">No challenges available</p>
          )}
        </div>

        {/* Active Instances */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Challenge Instances</h2>
          
          <div className="space-y-3">
            {activeInstances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{instance.challenge_name}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      instance.status === 'running' ? 'bg-green-100 text-green-800' :
                      instance.status === 'starting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {instance.status}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      Started {new Date(instance.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {instance.access_info && (
                    <div className="mt-2">
                      <pre className="text-xs bg-gray-100 p-2 rounded text-gray-700">
                        {instance.access_info}
                      </pre>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => stopInstance(instance.id)}
                  className="ml-3 text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Stop
                </button>
              </div>
            ))}
          </div>

          {activeInstances.length === 0 && (
            <p className="text-gray-500 text-center py-4">No active instances</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;