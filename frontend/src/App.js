import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // state for auth
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  
  // state for files
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // state for forms
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // state for sharing
  const [shareFileId, setShareFileId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');

  // Railway backend URL
  const API_URL = 'file-sharing-app-production-6ea2.up.railway.app';

  // check if already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setLoggedIn(true);
    }
  }, []);

  // get files when logged in
  useEffect(() => {
    if (loggedIn) {
      getFiles();
    }
  }, [loggedIn]);

  // register function
  const handleRegister = async () => {
    try {
      const response = await fetch('${API_URL}/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        alert('Registration successful! Please login.');
        setName('');
        setEmail('');
        setPassword('');
        setShowRegister(false);
      }
    } catch (err) {
      alert('Registration failed');
    }
  };

  // login function
  const handleLogin = async () => {
    try {
      const response = await fetch('${API_URL}/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setToken(data.token);
        setUser(data.user);
        setLoggedIn(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  // logout
  const handleLogout = () => {
  setLoggedIn(false);
  setToken('');
  setUser(null);
  setName('');
  setEmail('');
  setPassword('');
  localStorage.clear();
};

  // get files
  const getFiles = async () => {
    try {
      const response = await fetch('${API_URL}/myfiles', {
        headers: { 'auth': token }
      });
      const data = await response.json();
      if (!data.error) {
        setFiles(data);
      }
    } catch (err) {
      console.log('Failed to get files');
    }
  };

  // upload file
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('${API_URL}/upload', {
        method: 'POST',
        headers: { 'auth': token },
        body: formData
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        alert('File uploaded!');
        setSelectedFile(null);
        getFiles();
      }
    } catch (err) {
      alert('Upload failed');
    }
  };

  // share with user
  const handleShare = async () => {
    try {
      const response = await fetch('${API_URL}/share', {
        method: 'POST',
        headers: {
          'auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId: shareFileId, email: shareEmail })
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        alert('File shared!');
        setShareFileId(null);
        setShareEmail('');
      }
    } catch (err) {
      alert('Share failed');
    }
  };

  // get share link
  const getLink = async (fileId) => {
    try {
      const response = await fetch('${API_URL}/create-link', {
        method: 'POST',
        headers: {
          'auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId })
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        alert('Share link: ' + data.link);
        // TODO: copy to clipboard feature
      }
    } catch (err) {
      alert('Failed to create link');
    }
  };

  // download file
  // Replace old downloadFile function with this:
const downloadFile = async (fileId, fileName) => {
  try {
    const response = await fetch(`${API_URL}/download/${fileId}`, {
      headers: { 'auth': token }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Download failed');
    }
  } catch (err) {
    alert('Download error');
  }
};

  // if not logged in show login/register
  if (!loggedIn) {
    return (
      <div className="container">
        <div className="auth-box">
          <h1>File Sharing App</h1>
          
          {showRegister ? (
            <div>
              <h2>Register</h2>
              <input 
                type="text" 
                placeholder="Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleRegister}>Register</button>
              <p onClick={() => setShowRegister(false)}>
                Already have account? Login
              </p>
            </div>
          ) : (
            <div>
              <h2>Login</h2>
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleLogin}>Login</button>
              <p onClick={() => setShowRegister(true)}>
                Don't have account? Register
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // main app after login
  return (
    <div className="container">
      <div className="header">
        <h1>My Files</h1>
        <div>
          <span>Hello, {user?.name}!</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="upload-box">
        <h3>Upload File</h3>
        <input 
          type="file" 
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button onClick={handleUpload}>Upload</button>
      </div>

      <div className="files-list">
        <h3>Your Files</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td>{file.original_name}</td>
                  <td>{Math.round(file.size / 1024)} KB</td>
                  <td>{file.type}</td>
                  <td>{new Date(file.uploaded).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => downloadFile(file.id, file.original_name)}>
                      Download
                    </button>
                    <button onClick={() => setShareFileId(file.id)}>
                      Share
                    </button>
                    <button onClick={() => getLink(file.id)}>
                      Get Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* share modal */}
      {shareFileId && (
        <div className="modal">
          <div className="modal-box">
            <h3>Share File</h3>
            <input 
              type="email" 
              placeholder="Enter user email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
            />
            <button onClick={handleShare}>Share</button>
            <button onClick={() => setShareFileId(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
