// Enhance.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Enhance.css';

const Enhance = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [scale, setScale] = useState(4);
  const [tile, setTile] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [enhanceCount, setEnhanceCount] = useState(0);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  const API_BASE = 'http://localhost:8013/api';

  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      if (!dropArea.contains(e.relatedTarget)) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    };

    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);

    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError('');
      setResult(null);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const enhanceImage = async (imageFile = null) => {
    const fileToEnhance = imageFile || selectedFile;
    
    if (!fileToEnhance) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToEnhance);
      formData.append('scale', scale.toString());
      formData.append('tile', tile.toString());

      const response = await fetch(`${API_BASE}/enhance`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setEnhanceCount(prev => prev + 1);
      } else {
        setError(data.error || 'Enhancement failed');
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const reEnhanceImage = async () => {
    if (!result || !result.enhanced_image_base64) {
      setError('No enhanced image available for further processing');
      return;
    }

    try {
      const response = await fetch(result.enhanced_image_base64);
      const blob = await response.blob();
      const file = new File([blob], `enhanced_${enhanceCount}.png`, { type: 'image/png' });
      
      await enhanceImage(file);
    } catch (err) {
      setError('Failed to process enhanced image');
    }
  };

  const downloadEnhancedImage = () => {
    if (result && result.enhanced_image_base64) {
      const link = document.createElement('a');
      link.href = result.enhanced_image_base64;
      link.download = `enhanced_${selectedFile.name.split('.')[0]}_v${enhanceCount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setEnhanceCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="enhance-container">
      <div className="background-effects">
        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      <div className="content-wrapper">
        <header className="header">
          <h1 className="title">
            <span className="title-main">AI Image Enhancement</span>
            <span className="title-sub">Real-ESRGAN Powered Super Resolution</span>
          </h1>
          <div className="enhance-counter">
            <div className="counter-badge">
              <span className="counter-number">{enhanceCount}</span>
              <span className="counter-label">Enhancements</span>
            </div>
          </div>
        </header>

        <div className="main-content">
          <div className="upload-section">
            <div 
              ref={dropAreaRef}
              className={`upload-area ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-preview' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="file-input"
              />
              
              {!previewUrl ? (
                <div className="upload-content">
                  <div className="upload-icon">
                    <div className="icon-cloud"></div>
                  </div>
                  <h3>Drop your image here or click to browse</h3>
                  <p>Supports PNG, JPG, JPEG • Max 50MB</p>
                  <button className="browse-btn" onClick={triggerFileInput}>
                    Choose Image File
                  </button>
                </div>
              ) : (
                <div className="preview-content">
                  <div className="preview-image-container">
                    <img 
                      src={previewUrl} 
                      alt="Original preview" 
                      className="preview-image"
                    />
                    <div className="preview-overlay">
                      <button className="change-btn" onClick={clearSelection}>
                        Change Image
                      </button>
                    </div>
                  </div>
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">Enhancement Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">
                  <span className="label-text">Scale Factor</span>
                  <span className="label-desc">Upscaling multiplier</span>
                </label>
                <div className="scale-selector">
                  {[2, 4, 8].map((value) => (
                    <button
                      key={value}
                      className={`scale-option ${scale === value ? 'active' : ''}`}
                      onClick={() => setScale(value)}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <span className="label-text">Tile Size</span>
                  <span className="label-desc">Memory optimization</span>
                </label>
                <div className="tile-input-container">
                  <input
                    type="number"
                    value={tile}
                    onChange={(e) => setTile(parseInt(e.target.value) || 0)}
                    placeholder="0 for automatic"
                    min="0"
                    className="tile-input"
                  />
                  <div className="input-hint">Use 400-800 for large images (0 = auto)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="action-section">
            <button 
              className={`enhance-btn ${loading ? 'loading' : ''} ${!selectedFile ? 'disabled' : ''}`}
              onClick={() => enhanceImage()}
              disabled={loading || !selectedFile}
            >
              <span className="btn-content">
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <div className="btn-icon">⚡</div>
                    Enhance Image
                  </>
                )}
              </span>
            </button>
          </div>

          {error && (
            <div className="error-section">
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <div className="error-text">{error}</div>
              </div>
            </div>
          )}

          {result && (
            <div className="result-section">
              <div className="result-header">
                <h3 className="result-title">Enhancement Complete!</h3>
                <div className="result-stats">
                  <div className="stat">
                    <span className="stat-label">Original</span>
                    <span className="stat-value">{result.original_dimensions}</span>
                  </div>
                  <div className="stat-arrow">→</div>
                  <div className="stat">
                    <span className="stat-label">Enhanced</span>
                    <span className="stat-value">{result.enhanced_dimensions}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Scale</span>
                    <span className="stat-value highlight">
                      {parseInt(result.enhanced_dimensions.split('x')[0]) / parseInt(result.original_dimensions.split('x')[0])}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="result-image-container">
                <img 
                  src={result.enhanced_image_base64} 
                  alt="Enhanced result" 
                  className="result-image"
                />
                <div className="result-actions">
                  <button className="action-btn download-btn" onClick={downloadEnhancedImage}>
                    <span className="action-icon">📥</span>
                    Download PNG
                  </button>
                  <button className="action-btn reenhance-btn" onClick={reEnhanceImage}>
                    <span className="action-icon">🔄</span>
                    Enhance Again
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="info-sections">
            <div className="info-grid">
              <div className="info-card">
                <h4>How It Works</h4>
                <ul className="feature-list">
                  <li>Original Quality Preserved</li>
                  <li>No Color Changes</li>
                  <li>Professional Enhancement</li>
                  <li>Memory Efficient</li>
                </ul>
              </div>

              <div className="info-card">
                <h4>Tips for Best Results</h4>
                <ul className="tip-list">
                  <li>Use 4x scale for most images</li>
                  <li>Tile size 400-800 for large images</li>
                  <li>First run downloads AI model</li>
                  <li>Output is always PNG</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enhance;