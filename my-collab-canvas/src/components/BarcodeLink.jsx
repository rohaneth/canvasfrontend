import React from 'react';
import './BarcodeLink.css';

const generateSimpleBarcode = (text) => {
  // Create a simple barcode-like pattern
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bars = [];
  
  for (let i = 0; i < 10; i++) {
    const height = 10 + ((hash * (i + 1)) % 50);
    bars.push(
      <div 
        key={i} 
        className="barcode-bar"
        style={{
          height: `${height}px`,
          width: '4px',
          backgroundColor: 'black',
          display: 'inline-block',
          margin: '0 1px'
        }}
      />
    );
  }
  
  return bars;
};

const BarcodeLink = ({ url, displayText }) => {
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="barcode-link-container" onClick={handleClick}>
      <div className="barcode-wrapper">
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px' }}>
          {generateSimpleBarcode(url)}
        </div>
      </div>
      <a 
        href={url} 
        className="link-text"
        target="_blank" 
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {displayText || url}
      </a>
    </div>
  );
};

export default BarcodeLink;
