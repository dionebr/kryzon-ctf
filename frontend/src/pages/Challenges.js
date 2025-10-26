import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await api.get('/challenges');
      setChallenges(response.data);
    } catch (err) {
      setError('Failed to load challenges');
      console.error('Error fetching challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (challengeId) => {
    try {
      const response = await api.post(`/challenges/${challengeId}/start`);
      // Refresh challenges to show updated instance info
      fetchChallenges();
      alert(`Challenge started! Access details: ${JSON.stringify(response.data)}`);
    } catch (err) {
      alert('Failed to start challenge: ' + (err.response?.data?.message || err.message));
    }
  };

  const stopChallenge = async (challengeId) => {
    try {
      await api.post(`/challenges/${challengeId}/stop`);
      fetchChallenges();
      alert('Challenge stopped successfully!');
    } catch (err) {
      alert('Failed to stop challenge: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="text-center py-8">Loading challenges...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Challenges</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{challenge.name}</h2>
            <p className="text-gray-600 mb-4">{challenge.description}</p>
            
            <div className="mb-4">
              <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {challenge.difficulty}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                {challenge.category}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Points: <span className="font-medium">{challenge.points}</span>
              </p>
            </div>

            {challenge.instance ? (
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  Status: <span className="font-medium">{challenge.instance.status}</span>
                </p>
                {challenge.instance.access_info && (
                  <div className="mt-2 text-sm text-blue-700">
                    <pre className="whitespace-pre-wrap">{challenge.instance.access_info}</pre>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex gap-2">
              {!challenge.instance ? (
                <button
                  onClick={() => startChallenge(challenge.id)}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Start Challenge
                </button>
              ) : (
                <button
                  onClick={() => stopChallenge(challenge.id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Stop Challenge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No challenges available at the moment.
        </div>
      )}
    </div>
  );
};

export default Challenges;