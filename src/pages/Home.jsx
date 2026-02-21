import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  // --- Library States ---
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Social Data States ---
  const [socialSearch, setSocialSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [network, setNetwork] = useState({ friends: [], requests: [] });
  
  // --- Social & Privacy States ---
  const [isPublic, setIsPublic] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  
  // --- Friend Viewing States ---
  const [viewingFriend, setViewingFriend] = useState(null); 
  const [friendBooks, setFriendBooks] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchBooks();
    }
  }, [navigate, token]);

  useEffect(() => {
    if (showSocials && token) {
      fetchNetwork();
    }
  }, [showSocials, token]);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('https://yourbooks-backend.onrender.com/api/books', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  const fetchNetwork = async () => {
    try {
      const res = await axios.get('https://yourbooks-backend.onrender.com/api/social/network', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNetwork({ friends: res.data.friends, requests: res.data.requests });
    } catch (error) {
      console.error("Failed to fetch network:", error);
    }
  };

  const fetchFriendLibrary = async (friendId, friendName) => {
    try {
      const res = await axios.get(`https://yourbooks-backend.onrender.com/api/social/public-books/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriendBooks(res.data);
      setViewingFriend({ id: friendId, username: friendName });
      setShowSocials(false); 
      setSearchQuery(''); 
    } catch (error) {
      alert("Failed to load friend's library.");
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await axios.delete(`https://yourbooks-backend.onrender.com/api/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBooks();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // --- THE FIXED UPLOAD FUNCTION (Notice the 'async'!) ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !pdfFile) return alert("Please provide a title and a PDF file!");

    if (isPublic) {
        const proceed = window.confirm("Careful! You are marking this book as PUBLIC. All your friends will be able to read this book. Proceed?");
        if (!proceed) return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('pdfFile', pdfFile);
    if (coverImage) formData.append('coverImage', coverImage);
    formData.append('isPublic', isPublic);

    try {
      await axios.post('https://yourbooks-backend.onrender.com/api/books/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      setTitle('');
      setPdfFile(null);
      setCoverImage(null);
      setIsPublic(false);
      fetchBooks(); 
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error.response?.data?.error || "Failed to upload book"); 
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!socialSearch) return;
    try {
      const res = await axios.get(`https://yourbooks-backend.onrender.com/api/social/search?q=${socialSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const sendFriendRequest = async (targetId) => {
    try {
      await axios.post(`https://yourbooks-backend.onrender.com/api/social/request/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(prev => prev.map(user => 
        user._id === targetId ? { ...user, isRequested: true } : user
      ));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send request');
    }
  };

  const acceptFriendRequest = async (requesterId) => {
    try {
      await axios.post(`https://yourbooks-backend.onrender.com/api/social/accept/${requesterId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNetwork();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to accept request');
    }
  };

  const handleUnfriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to unfriend this user? You will lose access to their library.")) return;
    try {
      await axios.post(`https://yourbooks-backend.onrender.com/api/social/unfriend/${friendId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNetwork();
    } catch (error) {
      console.error("Failed to unfriend:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const activeBookList = viewingFriend ? friendBooks : books;
  const filteredBooks = activeBookList.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <div className="header">
        <h1>📚 {username ? `${username}'s Library` : 'My Library'}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowSocials(true)} style={{ padding: '8px 16px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            👥 Socials
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            ➜] Logout
          </button>
        </div>
      </div>

      {!viewingFriend && (
        <div className="upload-section">
          <h3 style={{ marginBottom: '15px' }}>Add a New Book</h3>
          <form className="upload-form" onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input 
              type="text" 
              className="upload-input"
              placeholder="Enter book title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              style={{ width: '100%' }}
            />

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70px', padding: '15px', background: '#2a2a2a', color: pdfFile ? '#28a745' : '#4a90e2', border: `2px dashed ${pdfFile ? '#28a745' : '#4a90e2'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center', transition: '0.3s' }}>
                <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{pdfFile ? `📄 ${pdfFile.name}` : '+ Select PDF File'}</span>
                <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>

              <label style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70px', padding: '15px', background: '#2a2a2a', color: coverImage ? '#28a745' : '#aaa', border: `2px dashed ${coverImage ? '#28a745' : '#555'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center', transition: '0.3s' }}>
                <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{coverImage ? `🖼️ ${coverImage.name}` : '+ Add Cover Image (Optional)'}</span>
                <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
              <span style={{ fontWeight: 'bold', color: isPublic ? '#28a745' : '#888', flex: 1, fontSize: '0.9rem', lineHeight: '1.4' }}>
                {isPublic ? '🌍 Public Book (Visible to Friends)' : '🔒 Private Book (Only you)'}
              </span>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                style={{
                  width: '50px', minWidth: '50px', height: '26px', borderRadius: '15px', border: 'none', cursor: 'pointer',
                  background: isPublic ? '#28a745' : '#555', position: 'relative', transition: '0.3s', flexShrink: 0
                }}
              >
                <div style={{
                  width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                  position: 'absolute', top: '3px', left: isPublic ? '27px' : '3px', transition: '0.3s'
                }} />
              </button>
            </div>

            <button type="submit" className="upload-btn" disabled={isUploading} style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}>
              {isUploading ? 'Uploading to Vault...' : 'Upload Book'}
            </button>
          </form>
        </div>
      )}

      {/* --- DYNAMIC TOOLBAR WITH STORAGE METER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <h2 className="library-title" style={{ margin: 0 }}>
            {viewingFriend ? `🌍 ${viewingFriend.username}'s Public Books` : 'Your Collection'}
          </h2>

          {!viewingFriend && (() => {
            const MAX_MB = 100;
            const usedBytes = books.reduce((acc, book) => acc + (book.fileSize || 0), 0);
            const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
            const percent = Math.min((usedMB / MAX_MB) * 100, 100);

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#888', background: '#1a1a1a', padding: '6px 12px', borderRadius: '20px', border: '1px solid #333' }}>
                <span style={{ fontWeight: 'bold' }}>Storage</span>
                <div style={{ width: '100px', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: percent > 90 ? '#dc3545' : '#28a745', transition: 'width 0.3s ease' }}></div>
                </div>
                <span>{usedMB} / {MAX_MB} MB</span>
              </div>
            );
          })()}

          {viewingFriend && (
            <button 
              onClick={() => setViewingFriend(null)} 
              style={{ padding: '6px 12px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🔙 Back to My Library
            </button>
          )}
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search books..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '30px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      <div className="grid">
        {activeBookList.length === 0 ? (
          <p style={{ color: '#888' }}>
            {viewingFriend ? "This user hasn't uploaded any public books yet." : "Your library is empty. Upload a PDF to start reading!"}
          </p>
        ) : filteredBooks.length === 0 ? (
          <p style={{ color: '#888' }}>No books found matching "{searchQuery}".</p>
        ) : (
          filteredBooks.map((book) => (
            <div className="book-card" key={book._id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: book.isPublic ? '#28a745' : '#555', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10 }}>
                {book.isPublic ? '🌍 Public' : '🔒 Private'}
              </div>

              {!viewingFriend && (
                <button onClick={() => handleDelete(book._id)} title="Delete Book" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(220, 53, 69, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', zIndex: 10 }}>✕</button>
              )}

              {book.coverImage ? (
                <img src={book.coverImage.startsWith('http') ? book.coverImage : `https://yourbooks-backend.onrender.com/${book.coverImage.replace(/\\/g, '/')}`} alt="cover" style={{ width: '100%', height: '280px', objectFit: 'cover', borderBottom: '1px solid #333' }} />
              ) : (
                <div className="book-cover">📖</div>
              )}
              
              <div className="book-info">
                <h4 className="book-title" title={book.title}>{book.title}</h4>
                <p className="book-progress">
                  {viewingFriend
                    ? (localStorage.getItem(`progress_${book._id}`)
                      ? `You're on Page ${localStorage.getItem(`progress_${book._id}`)}`
                      : "Not started yet")
                    : `Last read: Page ${book.currentPage || 1}`
                  }
                </p>
                <Link to={`/read?bookId=${book._id}`} className="read-btn">Open Book</Link>
              </div>
            </div>
          ))
        )}
      </div>

      {showSocials && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e1e1e', width: '90%', maxWidth: '600px', height: '80vh', borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #333', background: '#121212' }}>
              <h2 style={{ margin: 0 }}>Social Network</h2>
              <button onClick={() => setShowSocials(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #333', background: '#1a1a1a' }}>
              <button onClick={() => setActiveTab('search')} style={{ flex: 1, padding: '15px', background: activeTab === 'search' ? '#2a2a2a' : 'transparent', color: activeTab === 'search' ? '#4a90e2' : '#888', border: 'none', borderBottom: activeTab === 'search' ? '2px solid #4a90e2' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                🔍 Search Users
              </button>
              <button onClick={() => setActiveTab('requests')} style={{ flex: 1, padding: '15px', background: activeTab === 'requests' ? '#2a2a2a' : 'transparent', color: activeTab === 'requests' ? '#4a90e2' : '#888', border: 'none', borderBottom: activeTab === 'requests' ? '2px solid #4a90e2' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                🔔 Requests
              </button>
              <button onClick={() => setActiveTab('friends')} style={{ flex: 1, padding: '15px', background: activeTab === 'friends' ? '#2a2a2a' : 'transparent', color: activeTab === 'friends' ? '#4a90e2' : '#888', border: 'none', borderBottom: activeTab === 'friends' ? '2px solid #4a90e2' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                🤝 Friends
              </button>
            </div>

            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              {activeTab === 'search' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <form onSubmit={handleSearchUsers} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Search for a username..." 
                      value={socialSearch}
                      onChange={(e) => setSocialSearch(e.target.value)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#121212', color: '#fff', outline: 'none' }}
                    />
                    <button type="submit" style={{ padding: '12px 20px', background: '#4a90e2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Search
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {searchResults.length === 0 ? (
                      <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>No users found. Try searching for a name!</p>
                    ) : (
                      searchResults.map(user => (
                        <div key={user._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>👤 {user.username}</span>
                          
                          {user.isFriend ? (
                            <button disabled style={{ padding: '8px 16px', background: 'transparent', color: '#888', border: '1px solid #555', borderRadius: '6px', fontWeight: 'bold', cursor: 'not-allowed' }}>
                              Friends
                            </button>
                          ) : user.isRequested ? (
                            <button disabled style={{ padding: '8px 16px', background: '#555', color: '#ccc', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'not-allowed' }}>
                              Requested
                            </button>
                          ) : (
                            <button 
                              onClick={() => sendFriendRequest(user._id)}
                              style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              + Add Friend
                            </button>
                          )}

                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {network.requests.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>No pending friend requests.</p>
                  ) : (
                    network.requests.map(req => (
                      <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>👤 {req.username}</span>
                        <button 
                          onClick={() => acceptFriendRequest(req._id)}
                          style={{ padding: '8px 16px', background: '#4a90e2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Accept
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeTab === 'friends' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {network.friends.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>You haven't added any friends yet.</p>
                  ) : (
                    network.friends.map(friend => (
                      <div key={friend._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>🤝 {friend.username}</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => handleUnfriend(friend._id)}
                            style={{ padding: '8px 16px', background: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Unfriend
                          </button>
                          <button 
                            onClick={() => fetchFriendLibrary(friend._id, friend.username)}
                            style={{ padding: '8px 16px', background: '#555', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            View Library
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Home;