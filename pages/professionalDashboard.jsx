import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProfessionalDashboard() {
  const [students, setStudents] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [newOpportunity, setNewOpportunity] = useState({ title: '', description: '', company: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await fetch('/api/professional/students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const studentData = await studentRes.json();
        setStudents(studentData.students || []);

        const oppRes = await fetch('/api/professional/opportunities', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const oppData = await oppRes.json();
        setOpportunities(oppData.opportunities || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleOpportunitySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/professional/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newOpportunity),
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities([...opportunities, data.opportunity]);
        setNewOpportunity({ title: '', description: '', company: '' });
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (err) {
      setError('Error posting opportunity.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-4xl font-bold text-white mb-8">Professional Dashboard</h1>
      <motion.section
        className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-white mb-4">Post New Opportunity</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleOpportunitySubmit}>
          <input
            type="text"
            placeholder="Opportunity Title"
            value={newOpportunity.title}
            onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
            className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
            required
          />
          <input
            type="text"
            placeholder="Company"
            value={newOpportunity.company}
            onChange={(e) => setNewOpportunity({ ...newOpportunity, company: e.target.value })}
            className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
            required
          />
          <textarea
            placeholder="Description"
            value={newOpportunity.description}
            onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
            className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
            required
          />
          <motion.button
            type="submit"
            className="bg-green-500 text-black p-3 rounded font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Post Opportunity
          </motion.button>
        </form>
      </motion.section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.section
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">Recommended Students</h2>
          {students.length === 0 && <p className="text-gray-300">No students found yet.</p>}
          {students.map((student, index) => (
            <motion.div
              key={index}
              className="bg-gray-700 p-4 rounded mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-white">{student.name}</h3>
              <p className="text-gray-300">{student.skills?.join(', ') || 'No skills listed'}</p>
              <Link href={`/student/${student.id}`} className="text-green-400">View Profile</Link>
            </motion.div>
          ))}
        </motion.section>
        <motion.section
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">Your Opportunities</h2>
          {opportunities.length === 0 && <p className="text-gray-300">No opportunities posted yet.</p>}
          {opportunities.map((opp, index) => (
            <motion.div
              key={index}
              className="bg-gray-700 p-4 rounded mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-white">{opp.title}</h3>
              <p className="text-gray-300">{opp.company}</p>
              <p className="text-gray-300">{opp.description}</p>
            </motion.div>
          ))}
        </motion.section>
      </div>
    </div>
  );
}