const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const dbPath = path.join(__dirname, 'spotify_users.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Table creation error:', err);
    else console.log('Users table ready');
  });
}

// Helper: Generate JWT token
function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware: Verify authentication
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  const decoded = verifyToken(token);
  if (!decoded) return res.status(403).json({ error: 'Invalid or expired token' });
  
  req.user = decoded;
  next();
}

// Route: Sign up
app.post('/auth/signup', async (req, res) => {
  const { email, password, display_name } = req.body;

  // Validation
  if (!email || !password || !display_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    db.run(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
      [email, hashedPassword, display_name],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already registered' });
          }
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create account' });
        }

        // Generate token
        const token = generateToken(this.lastID, email);
        res.status(201).json({
          success: true,
          message: 'Account created successfully',
          token,
          user: { email, display_name }
        });
      }
    );
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Route: Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = generateToken(user.id, user.email);
      res.json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: { email: user.email, display_name: user.display_name }
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Route: Get user profile (requires authentication)
app.get('/auth/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, email, display_name, created_at FROM users WHERE id = ?', 
    [req.user.userId], 
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    }
  );
});

// Route: Logout (optional - client-side token removal is sufficient)
app.post('/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🎵 Spotify Secure Search backend running on http://localhost:${PORT}`);
});
