import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Landing Page Component
export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const buttonVariants = {
    hover: { scale: 1.1, boxShadow: '0px 4px 15px rgba(0, 255, 128, 0.5)' },
    tap: { scale: 0.95 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <Head>
        <title>ConnectSphere - AI-Powered Career Connections</title>
        <meta name="description" content="AI-driven platform connecting students with internship and job opportunities." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <h1 className="text-3xl font-bold">ConnectSphere</h1>
        <nav className="space-x-4">
          <Link href="/login" className="hover:text-green-400 transition">Login</Link>
          <Link href="/signup" className="hover:text-green-400 transition">Sign Up</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <motion.section
        className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="text-5xl md:text-7xl font-extrabold mb-6"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Discover Your Future with AI
        </motion.h2>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl">
          ConnectSphere uses cutting-edge AI to match students with internships, jobs, and mentors tailored to your passions and skills.
        </p>
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="bg-green-500 text-black px-8 py-4 rounded-full font-semibold text-lg"
          onClick={() => router.push('/signup')}
        >
          Get Started
        </motion.button>
      </motion.section>
    </div>
  );
}
