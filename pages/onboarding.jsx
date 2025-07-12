import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function Onboarding() {
  const [formData, setFormData] = useState({
    resume: null,
    activities: '',
    hobbies: '',
    projects: '',
    socialLinks: { linkedin: '', youtube: '', instagram: '' },
    careerGoals: '',
    industries: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('socialLinks.')) {
      const key = name.split('.')[1];
      setFormData({
        ...formData,
        socialLinks: { ...formData.socialLinks, [key]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('resume', formData.resume);
    form.append('data', JSON.stringify(formData));

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form,
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.form
        className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-bold text-white mb-6">Tell Us About Yourself</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-white mb-2">Upload Resume (PDF)</label>
          <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full" required />
        </div>
        <textarea
          name="activities"
          placeholder="Activities and passions"
          value={formData.activities}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          required
        />
        <textarea
          name="hobbies"
          placeholder="Hobbies"
          value={formData.hobbies}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        <textarea
          name="projects"
          placeholder="Past projects and experiences"
          value={formData.projects}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        <input
          name="socialLinks.linkedin"
          placeholder="LinkedIn URL"
          value={formData.socialLinks.linkedin}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        <input
          name="socialLinks.youtube"
          placeholder="YouTube URL"
          value={formData.socialLinks.youtube}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        <input
          name="socialLinks.instagram"
          placeholder="Instagram URL"
          value={formData.socialLinks.instagram}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        <textarea
          name="careerGoals"
          placeholder="Career goals"
          value={formData.careerGoals}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          required
        />
        <textarea
          name="industries"
          placeholder="Preferred industries"
          value={formData.industries}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          required
        />
        <motion.button
          type="submit"
          className="w-full bg-green-500 text-black p-3 rounded font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Complete Profile
        </motion.button>
      </motion.form>
    </div>
  );
}