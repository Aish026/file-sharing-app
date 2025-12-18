const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(cors());
app.use(express.json());
app.use('/files', express.static('uploads'));

// database connection 
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.log('DB connection failed', err);
  } else {
    console.log('Connected to database');
  }
});

// create uploads folder if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// file upload setup 
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5000000 } // 5MB limit
});

// check if user is logged in 
function checkAuth(req, res, next) {
  const token = req.headers['auth'];
  if (!token) {
    return res.json({ error: 'Not logged in' });
  }
  
  try {
    const data = jwt.verify(token, 'mysecret123');
    req.userId = data.id;
    next();
  } catch (err) {
    res.json({ error: 'Invalid token' });
  }
}

// Register
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ error: 'All fields required' });
  }

  const hash = await bcrypt.hash(password, 10);
  
  const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(sql, [name, email, hash], (err, result) => {
    if (err) {
      return res.json({ error: 'Registration failed' });
    }
    res.json({ message: 'User created' });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.json({ error: 'User not found' });
    }
    
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.json({ error: 'Wrong password' });
    }
    
    // create token
    const token = jwt.sign({ id: user.id }, 'mysecret123');
    res.json({ 
      token: token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
});

// Upload File
app.post('/upload', checkAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ error: 'No file' });
  }
  
  const sql = 'INSERT INTO files (name, original_name, size, type, owner) VALUES (?, ?, ?, ?, ?)';
  const values = [
    req.file.filename,
    req.file.originalname,
    req.file.size,
    req.file.mimetype,
    req.userId
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.json({ error: 'Upload failed' });
    }
    res.json({ message: 'File uploaded', fileId: result.insertId });
  });
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Get my files
app.get('/myfiles', checkAuth, (req, res) => {
  const sql = 'SELECT * FROM files WHERE owner = ?';
  db.query(sql, [req.userId], (err, results) => {
    if (err) {
      return res.json({ error: 'Failed to get files' });
    }
    res.json(results);
  });
});

// Share file with user
app.post('/share', checkAuth, (req, res) => {
  const { fileId, email } = req.body;
  
  // first check if file belongs to user
  const checkSql = 'SELECT * FROM files WHERE id = ? AND owner = ?';
  db.query(checkSql, [fileId, req.userId], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ error: 'Not your file' });
    }
    
    // find user to share with
    const findUser = 'SELECT id FROM users WHERE email = ?';
    db.query(findUser, [email], (err, users) => {
      if (err || users.length === 0) {
        return res.json({ error: 'User not found' });
      }
      
      // create share
      const shareSql = 'INSERT INTO shares (file_id, shared_with) VALUES (?, ?)';
      db.query(shareSql, [fileId, users[0].id], (err) => {
        if (err) {
          return res.json({ error: 'Share failed' });
        }
        res.json({ message: 'File shared' });
      });
    });
  });
});

// Create shareable link
app.post('/create-link', checkAuth, (req, res) => {
  const { fileId } = req.body;
  
  // check ownership
  const checkSql = 'SELECT * FROM files WHERE id = ? AND owner = ?';
  db.query(checkSql, [fileId, req.userId], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ error: 'Not your file' });
    }
    
    // generate random link
    const link = 'link-' + Math.random().toString(36).substr(2, 9);
    
    const sql = 'INSERT INTO shares (file_id, link) VALUES (?, ?)';
    db.query(sql, [fileId, link], (err) => {
      if (err) {
        return res.json({ error: 'Failed to create link' });
      }
      res.json({ link: `https://file-sharing-app-production-6ea2.up.railway.app/shared/${link}` });
    });
  });
});

// Download File
app.get('/download/:id', checkAuth, (req, res) => {
  const fileId = req.params.id;
  
  // check if user owns file or has access
  const sql = `
    SELECT f.* FROM files f
    LEFT JOIN shares s ON f.id = s.file_id
    WHERE f.id = ? AND (f.owner = ? OR s.shared_with = ?)
  `;
  
  db.query(sql, [fileId, req.userId, req.userId], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ error: 'No access' });
    }
    
    const file = results[0];
    const filepath = path.join(__dirname, 'uploads', file.name);
    res.download(filepath, file.original_name);
  });
});

// Access shared link
app.get('/shared/:link', checkAuth, (req, res) => {
  const link = req.params.link;
  
  const sql = `
    SELECT f.* FROM files f
    JOIN shares s ON f.id = s.file_id
    WHERE s.link = ?
  `;
  
  db.query(sql, [link], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ error: 'Invalid link' });
    }
    
    const file = results[0];
    const filepath = path.join(__dirname, 'uploads', file.name);
    res.download(filepath, file.original_name);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
