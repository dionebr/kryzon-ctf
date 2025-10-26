import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const fetchChallenge = async () => {
    try {
      const response = await api.get(`/challenges/${id}`);
      setChallenge(response.data);
    } catch (err) {
      setError('Failed to load challenge details');
      console.error('Error fetching challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async () => {
    try {
      const response = await api.post(`/challenges/${id}/start`);
      setChallenge(prev => ({
        ...prev,
        instance: response.data
      }));
    } catch (err) {
      alert('Failed to start challenge: ' + (err.response?.data?.message || err.message));
    }
  };

  const stopChallenge = async () => {
    try {
      await api.post(`/challenges/${id}/stop`);
      setChallenge(prev => ({
        ...prev,
        instance: null
      }));
    } catch (err) {
      alert('Failed to stop challenge: ' + (err.response?.data?.message || err.message));
    }
  };

  const submitFlag = async (e) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/challenges/${id}/submit`, { flag });
      if (response.data.correct) {
        alert(`Correct! You earned ${challenge.points} points!`);
        setFlag('');
        fetchChallenge(); // Refresh to show solved status
      } else {
        alert('Incorrect flag. Try again!');
      }
    } catch (err) {
      alert('Failed to submit flag: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading challenge...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!challenge) return <div className="text-center py-8">Challenge not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button
        onClick={() => navigate('/challenges')}
        className="mb-6 text-blue-500 hover:text-blue-600 flex items-center"
      >
        ← Back to Challenges
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{challenge.name}</h1>
          {challenge.solved && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Solved ✓
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
              challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {challenge.difficulty}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Category: <span className="font-medium text-gray-800">{challenge.category}</span>
          </div>
          <div className="text-sm text-gray-600">
            Points: <span className="font-medium text-gray-800">{challenge.points}</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{challenge.description}</p>
          </div>
        </div>

        {challenge.instance && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Instance Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">
                  Status: <span className="font-medium">{challenge.instance.status}</span>
                </p>
                <p className="text-sm text-blue-700">
                  Started: <span className="font-medium">
                    {new Date(challenge.instance.created_at).toLocaleString()}
                  </span>
                </p>
              </div>
              {challenge.instance.access_info && (
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Access Information:</p>
                  <pre className="text-xs bg-blue-100 p-2 rounded text-blue-800 whitespace-pre-wrap">
                    {challenge.instance.access_info}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {!challenge.instance ? (
            <button
              onClick={startChallenge}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Start Challenge
            </button>
          ) : (
            <button
              onClick={stopChallenge}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Stop Challenge
            </button>
          )}
        </div>

        {!challenge.solved && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Submit Flag</h2>
            <form onSubmit={submitFlag} className="flex gap-2">
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="Enter flag here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !flag.trim()}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetail;