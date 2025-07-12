const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const { Resend } = require('resend');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Sign Up API
app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ full_name: fullName, email, password: hashedPassword, role }])
      .select('id, role')
      .single();

    if (error) {
      throw error;
    }

    const token = jwt.sign({ id: data.id, role: data.role }, process.env.JWT_SECRET || 'your_jwt_secret', {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Email already exists' });
  }
});

// Login API
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data || !(await bcrypt.compare(password, data.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: data.id, role: data.role }, process.env.JWT_SECRET || 'your_jwt_secret', {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Onboarding API
app.post('/api/onboarding', authenticateToken, upload.single('resume'), async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can complete onboarding' });
  }

  const { activities, hobbies, projects, socialLinks, careerGoals, industries } = JSON.parse(req.body.data);
  let resumeText = '';

  if (req.file) {
    try {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    } catch (err) {
      console.error(err);
      return res.status(400).json({ message: 'Error parsing resume' });
    }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: req.user.id,
          resume_text: resumeText,
          activities,
          hobbies,
          projects,
          social_links: socialLinks,
          career_goals: careerGoals,
          industries,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // AI Profile Analysis
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Analyze the following student profile and generate a summary:\nResume: ${resumeText}\nActivities: ${activities}\nHobbies: ${hobbies}\nProjects: ${projects}\nCareer Goals: ${careerGoals}\nIndustries: ${industries}`,
        },
      ],
      max_tokens: 500,
    });

    const summary = aiResponse.choices[0].message.content;
    await supabase
      .from('profiles')
      .update({ ai_summary: summary })
      .eq('user_id', req.user.id);

    res.json({ message: 'Profile saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Matching API
app.get('/api/matches', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can access matches' });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Based on the following profile, recommend professionals and opportunities in JSON format:\n${JSON.stringify(profile)}`,
        },
      ],
      max_tokens: 1000,
    });

    let matches;
    try {
      matches = JSON.parse(aiResponse.choices[0].message.content);
    } catch {
      matches = {
        matches: [{ id: 1, name: 'Sample Professional', role: 'Engineer', company: 'Tech Corp' }],
        opportunities: [{ id: 1, title: 'Software Intern', company: 'Tech Corp' }],
      };
    }

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Professional Opportunity Posting
app.post('/api/professional/opportunities', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') {
    return res.status(403).json({ message: 'Only professionals can post opportunities' });
  }

  const { title, description, company } = req.body;

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .insert([{ user_id: req.user.id, title, description, company }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ opportunity: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Professional Opportunities Fetch
app.get('/api/professional/opportunities', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') {
    return res.status(403).json({ message: 'Only professionals can view their opportunities' });
  }

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) {
      throw error;
    }

    res.json({ opportunities: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Professional Student Recommendations
app.get('/api/professional/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') {
    return res.status(403).json({ message: 'Only professionals can view student recommendations' });
  }

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, ai_summary');

    if (error) {
      throw error;
    }

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Based on the following student profiles, recommend top students in JSON format:\n${JSON.stringify(profiles)}`,
        },
      ],
      max_tokens: 1000,
    });

    let students;
    try {
      students = JSON.parse(aiResponse.choices[0].message.content);
    } catch {
      students = [{ id: 1, name: 'Sample Student', skills: ['Python', 'JavaScript'] }];
    }

    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Assistant API
app.post('/api/assistant', authenticateToken, async (req, res) => {
  const { query } = req.body;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: query }],
      max_tokens: 500,
    });
    res.json({ response: aiResponse.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email Generation
app.post('/api/email/connect', authenticateToken, async (req, res) => {
  const { recipientId, message } = req.body;

  try {
    const { data: recipient, error } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', recipientId)
      .single();

    if (error || !recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Generate a personalized outreach email based on the message: ${message} for recipient: ${recipient.full_name}`,
        },
      ],
      max_tokens: 300,
    });

    await resend.emails.send({
      from: 'noreply@connectsphere.com',
      to: recipient.email,
      subject: 'ConnectSphere: New Connection Request',
      text: aiResponse.choices[0].message.content,
    });

    const { error: analyticsError } = await supabase
      .from('analytics')
      .insert([
        {
          user_id: req.user.id,
          action: 'email_sent',
          details: { recipient_id: recipientId, timestamp: new Date().toISOString() },
        },
      ]);

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
    }

    res.json({ message: 'Email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));