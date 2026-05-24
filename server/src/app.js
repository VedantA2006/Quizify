const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { auth } = require('./middleware/auth');

const app = express();

// Request Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Security & Cookie Parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "*"],
    }
  }
}));

const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [env.CLIENT_URL];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Strip trailing slashes to guarantee clean matching
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
    
    const isAllowed = cleanAllowed.includes(cleanOrigin) || 
                      cleanAllowed.includes('*') ||
                      cleanOrigin.endsWith('.vercel.app') || 
                      cleanOrigin.startsWith('http://localhost');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(cookieParser());

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Secure file downloads route
app.get('/api/files/:filename', auth, (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  res.sendFile(filePath);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.NODE_ENV });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/search', require('./routes/search'));
app.use('/api/share-links', require('./routes/shareLinks'));
app.use('/api/schedules', require('./routes/schedules'));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Serve built frontend (SPA)
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Frontend not built yet. Run: cd client && npm run build');
  }
});

// Error handler
app.use(errorHandler);

module.exports = app;
