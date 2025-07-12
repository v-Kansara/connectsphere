import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/matches', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setMatches(data.matches || []);
        setOpportunities(data.opportunities || []);
      } catch (err) {
        console.error('Error fetching matches:', err);
      }
    };
    fetchData();
  }, []);

  const handleAssistantQuery = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query: assistantQuery }),
      });
      const data = await res.json();
      setAssistantResponse(data.response);
    } catch (err) {
      setAssistantResponse('Error contacting AI assistant.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-4xl font-bold text-white mb-8">Your Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.section
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">AI Matches</h2>
          {matches.length === 0 && <p className="text-gray-300">No matches found yet.</p>}
          {matches.map((match, index) => (
            <motion.div
              key={index}
              className="bg-gray-700 p-4 rounded mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-white">{match.name}</h3>
              <p className="text-gray-300">{match.role} at {match.company}</p>
              <button
                onClick={() => {
                  fetch('/api/email/connect', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ recipientId: match.id, message: `Hi ${match.name}, I'd love to connect!` }),
                  });
                }}
                className="text-green-400"
              >
                Connect
              </button>
            </motion.div>
          ))}
        </motion.section>
        <motion.section
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">Opportunities</h2>
          {opportunities.length === 0 && <p className="text-gray-300">No opportunities found yet.</p>}
          {opportunities.map((opp, index) => (
            <motion.div
              key={index}
              className="bg-gray-700 p-4 rounded mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-white">{opp.title}</h3>
              <p className="text-gray-300">{opp.company}</p>
              <Link href={`/opportunity/${opp.id}`} className="text-green-400">Apply</Link>
            </motion.div>
          ))}
        </motion.section>
      </div>
      <motion.section
        className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-white mb-4">AI Assistant</h2>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-gray-300">Ask our AI assistant for help with your profile or connections.</p>
          <form onSubmit={handleAssistantQuery}>
            <input
              type="text"
              placeholder="Type your question..."
              value={assistantQuery}
              onChange={(e) => setAssistantQuery(e.target.value)}
              className="w-full p-3 mt-4 bg-gray-600 text-white rounded"
            />
            <motion.button
              type="submit"
              className="mt-4 bg-green-500 text-black p-3 rounded font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ask
            </motion.button>
          </form>
          {assistantResponse && <p className="text-white mt-4">{assistantResponse}</p>}
        </div>
      </motion.section>
    </div>
  );
}