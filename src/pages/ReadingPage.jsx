import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const ReadingPage = () => {
  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // --- Responsive State ---
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;

  // --- Theme State ---
  const [theme, setTheme] = useState(localStorage.getItem('readerTheme') || 'dark');
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const bookId = queryParams.get('bookId');
  const token = localStorage.getItem('token');

  // --- Theme Color Dictionaries ---
  const themes = {
    dark: { bg: '#121212', nav: '#1e1e1e', text: '#fff', border: '#333', pdfFilter: 'invert(0.9) hue-rotate(180deg)' },
    light: { bg: '#f5f5f5', nav: '#ffffff', text: '#333', border: '#ddd', pdfFilter: 'none' },
    sepia: { bg: '#f4ecd8', nav: '#e8ddc5', text: '#5b4636', border: '#d3c4a9', pdfFilter: 'sepia(0.5) contrast(0.9)' }
  };
  const currentTheme = themes[theme];

  // Window resize listener for responsive PDF scaling
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save theme choice when changed
  useEffect(() => {
    localStorage.setItem('readerTheme', theme);
  }, [theme]);

  useEffect(() => {
    if (!bookId || !token) {
      navigate('/');
      return;
    }

    const fetchBook = async () => {
      try {
        const res = await axios.get(`https://yourbooks-backend.onrender.com/api/books/${bookId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBook(res.data);
        
        // --- FIXED: Smart Progress Logic ---
        let startPage = 1; // Everyone defaults to page 1

        if (res.data.isOwner) {
          // If you own it, pull your progress from the database
          startPage = res.data.currentPage || 1;
        } else {
          // If it's a friend's book, ONLY look at your personal browser memory
          const localSavedPage = localStorage.getItem(`progress_${bookId}`);
          if (localSavedPage) startPage = parseInt(localSavedPage, 10);
        }
        
        setPageNumber(startPage);
        setLoading(false);
      } catch (error) {
        console.error("Error loading book:", error);
        alert("Failed to load the book. It may be private or deleted.");
        navigate('/');
      }
    };

    fetchBook();
  }, [bookId, navigate, token]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = async (offset) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      
      if (book.isOwner) {
        try {
          await axios.put(`https://yourbooks-backend.onrender.com/api/books/${bookId}/page`, 
            { currentPage: newPage },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error("Failed to save progress:", error);
        }
      } else {
        localStorage.setItem(`progress_${bookId}`, newPage);
      }
    }
  };

  if (loading) return <div style={{ color: 'white', background: '#121212', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading your book...</div>;

  return (
    <div style={{ background: currentTheme.bg, minHeight: '100vh', color: currentTheme.text, display: 'flex', flexDirection: 'column', transition: '0.3s ease' }}>
      
      {/* --- TOP NAVBAR --- */}
      <div style={{ 
        padding: isMobile ? '10px 15px' : '15px 30px', 
        background: currentTheme.nav, 
        borderBottom: `1px solid ${currentTheme.border}`, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        
        {/* Left Side: Back & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px', maxWidth: '70%' }}>
          <button onClick={() => navigate('/')} style={{ padding: '8px 12px', background: currentTheme.border, color: currentTheme.text, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1rem' }}>
            {isMobile ? '🔙' : '🔙 Back to Library'}
          </button>
          
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? '1rem' : '1.2rem', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {book.title}
          </h2>
          
          {!book.isOwner && !isMobile && (
             <span style={{ background: '#4a90e2', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
               👁️ Read-Only
             </span>
          )}
        </div>
        
        {/* Right Side: Theme Selector */}
        <div>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, cursor: 'pointer', outline: 'none', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1rem' }}
          >
            <option value="dark">🌙 {isMobile ? '' : 'Dark'}</option>
            <option value="sepia">☕ {isMobile ? '' : 'Sepia'}</option>
            <option value="light">☀️ {isMobile ? '' : 'Light'}</option>
          </select>
        </div>
      </div>

      {/* --- PDF CONTAINER --- */}
      {/* Added paddingBottom to prevent the sticky footer from covering text */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: isMobile ? '10px' : '20px', paddingBottom: '90px', overflowY: 'auto' }}>
        <div style={{ filter: currentTheme.pdfFilter, transition: 'filter 0.3s ease', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <Document
            file={book.pdfUrl.startsWith('http') ? book.pdfUrl : `https://yourbooks-backend.onrender.com/${book.pdfUrl.replace(/\\/g, '/')}`}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div style={{ color: currentTheme.text, padding: '20px', textAlign: 'center' }}>Loading pages...</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              // Dynamically scale based on window size to prevent overflow
              width={Math.min(windowWidth - (isMobile ? 20 : 60), 800)} 
            />
          </Document>
        </div>
      </div>

      {/* --- STICKY BOTTOM CONTROL BAR --- */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: currentTheme.nav, 
        borderTop: `1px solid ${currentTheme.border}`, 
        padding: '15px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '20px',
        zIndex: 50,
        boxShadow: '0 -4px 10px rgba(0,0,0,0.1)'
      }}>
        <button 
          disabled={pageNumber <= 1} 
          onClick={() => changePage(-1)} 
          style={{ padding: '10px 20px', background: pageNumber <= 1 ? currentTheme.border : '#4a90e2', color: 'white', border: 'none', borderRadius: '8px', cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          ◀ Prev
        </button>
        
        <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center', fontSize: isMobile ? '0.9rem' : '1rem' }}>
          {pageNumber} / {numPages || '--'}
        </span>
        
        <button 
          disabled={pageNumber >= numPages} 
          onClick={() => changePage(1)} 
          style={{ padding: '10px 20px', background: pageNumber >= numPages ? currentTheme.border : '#4a90e2', color: 'white', border: 'none', borderRadius: '8px', cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          Next ▶
        </button>
      </div>
      
    </div>
  );
};

export default ReadingPage;