class PosterResult {
  constructor() {
    this.canvas = document.getElementById('final-poster');
    this.ctx = this.canvas.getContext('2d');
    this.fullscreenCanvas = document.getElementById('fullscreen-canvas');
    this.fullscreenCtx = this.fullscreenCanvas.getContext('2d');
    this.fullscreenModal = document.getElementById('fullscreen-modal');
    
    // Buttons - Only bind to existing elements
    this.retakeBtn = document.getElementById('retake');
    this.downloadHdBtn = document.getElementById('download-hd');
    this.downloadWebBtn = document.getElementById('download-web');
    this.shareNativeBtn = document.getElementById('share-native');
    this.copyImageBtn = document.getElementById('copy-image');
    this.createAnotherBtn = document.getElementById('create-another');
    this.viewFullscreenBtn = document.getElementById('view-fullscreen');
    this.closeModalBtn = document.getElementById('close-modal');
    
    this.init();
  }

  init() {
    this.loadPosterFromStorage();
    this.bindEvents();
    this.setupCopyButtons();
  }

  loadPosterFromStorage() {
    try {
      const posterData = localStorage.getItem('gccd_poster_data');
      if (posterData) {
        const img = new Image();
        img.onload = () => {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          
          // Also prepare fullscreen canvas
          this.fullscreenCanvas.width = img.width;
          this.fullscreenCanvas.height = img.height;
          this.fullscreenCtx.drawImage(img, 0, 0);
          
          console.log('Poster loaded successfully, dimensions:', img.width, 'x', img.height);
        };
        img.onerror = () => {
          console.error('Failed to load poster image from localStorage');
          this.showNotification('Failed to load poster image.', 'error');
        };
        img.src = posterData;
      } else {
        // No poster data found, redirect back to main page
        this.showNotification('No poster data found. Redirecting...', 'error');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading poster:', error);
      this.showNotification('Error loading poster. Please try again.', 'error');
    }
  }

  bindEvents() {
    // Retake/Back button
    if (this.retakeBtn) {
      this.retakeBtn.addEventListener('click', () => {
        this.goBack();
      });
    }

    // Download buttons
    if (this.downloadHdBtn) {
      this.downloadHdBtn.addEventListener('click', () => {
        this.downloadPoster('hd');
      });
    }

    if (this.downloadWebBtn) {
      this.downloadWebBtn.addEventListener('click', () => {
        this.downloadPoster('web');
      });
    }

    // Share buttons
    if (this.shareNativeBtn) {
      this.shareNativeBtn.addEventListener('click', () => {
        this.sharePoster();
      });
    }

    if (this.copyImageBtn) {
      this.copyImageBtn.addEventListener('click', () => {
        this.copyImage();
      });
    }

    // Quick actions
    if (this.createAnotherBtn) {
      this.createAnotherBtn.addEventListener('click', () => {
        this.createAnother();
      });
    }

    if (this.viewFullscreenBtn) {
      this.viewFullscreenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('View fullscreen button clicked');
        this.viewFullscreen();
      });
    }

    // Modal controls
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Close modal button clicked');
        this.closeFullscreen();
      });
    }

    if (this.fullscreenModal) {
      this.fullscreenModal.addEventListener('click', (e) => {
        if (e.target === this.fullscreenModal) {
          console.log('Modal background clicked');
          this.closeFullscreen();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed');
        this.closeFullscreen();
      } else if (e.key === 'f' || e.key === 'F') {
        console.log('F key pressed');
        e.preventDefault();
        this.viewFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.downloadPoster('hd');
      }
    });
  }

  setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const platform = button.dataset.platform;
        const textElement = button.closest('.platform-text').querySelector('p');
        
        try {
          await navigator.clipboard.writeText(textElement.textContent);
          
          // Update button state
          const copyText = button.querySelector('.copy-text');
          const originalText = copyText.textContent;
          button.classList.add('copied');
          copyText.textContent = 'Copied!';
          
          // Reset button after 2 seconds
          setTimeout(() => {
            button.classList.remove('copied');
            copyText.textContent = originalText;
          }, 2000);
          
        } catch (err) {
          console.error('Failed to copy text:', err);
        }
      });
    });
  }

  goBack() {
    // Clear the poster data and go back to main page
    localStorage.removeItem('gccd_poster_data');
    window.location.href = 'index.html';
  }

  downloadPoster(quality = 'hd') {
    try {
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
      
      let dataUrl, filename;
      
      if (quality === 'hd') {
        // High quality PNG - but check canvas size first
        const canvasArea = this.canvas.width * this.canvas.height;
        if (canvasArea > 2000000) { // If canvas is very large (> 2MP)
          // Use high quality JPEG instead of PNG for large images
          dataUrl = this.canvas.toDataURL('image/jpeg', 0.95);
          filename = `gccd-2025-poster-hd-${timestamp}.jpg`;
        } else {
          dataUrl = this.canvas.toDataURL('image/png', 1.0);
          filename = `gccd-2025-poster-hd-${timestamp}.png`;
        }
      } else {
        // Web optimized JPEG
        dataUrl = this.canvas.toDataURL('image/jpeg', 0.85);
        filename = `gccd-2025-poster-web-${timestamp}.jpg`;
      }
      
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      this.showNotification(`${quality.toUpperCase()} poster downloaded successfully!`, 'success');
    } catch (error) {
      console.error('Download error:', error);
      this.showNotification('Failed to download poster.', 'error');
    }
  }

  async sharePoster() {
    try {
      const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'gccd-2025-poster.png', { type: 'image/png' });

      // Define share text here to ensure it's available
      const shareText = `🎉 Just created my personalized GCCD 2025 poster! Join me at Cloud Community Day Bhopal 2025 🚀\n\n#CCD2025 #CCDBHOPAL #GoogleDeveloperGroups #CloudCommunityDay #TechEvents #Bhopal #GDGBhopal #GoogleCloud`;

      if (navigator.share && navigator.canShare({ files: [file] })) {
        // Include both text and file in share
        await navigator.share({
          title: 'GCCD 2025 Poster',
          text: shareText,
          files: [file]
        });
        this.showNotification('Poster shared successfully! 🎉', 'success');
      } else {
        // Fallback for platforms without native sharing
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        // Show modal with sharing options
        this.showShareTextModal(this.shareTexts);
      }
    } catch (error) {
      console.error('Share error:', error);
      this.fallbackShare();
    }
  }

  showShareTextModal(shareTexts) {
    // Create a temporary modal to show share text options
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 15px;
      padding: 30px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `;
    
    content.innerHTML = `
      <h3 style="margin-bottom: 20px; text-align: center; color: #333;">Choose Platform Text</h3>
      <p style="text-align: center; color: #666; margin-bottom: 20px; font-size: 14px;">Image copied! Select text for your platform:</p>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #4285F4;">General/Instagram:</strong>
        <textarea readonly style="width: 100%; height: 100px; margin-top: 5px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;" onclick="this.select()">${shareTexts.instagram}</textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #1DA1F2;">Twitter:</strong>
        <textarea readonly style="width: 100%; height: 80px; margin-top: 5px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;" onclick="this.select()">${shareTexts.twitter}</textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #0A66C2;">LinkedIn:</strong>
        <textarea readonly style="width: 100%; height: 120px; margin-top: 5px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;" onclick="this.select()">${shareTexts.linkedin}</textarea>
      </div>
      
      <div style="margin-bottom: 20px;">
        <strong style="color: #1877F2;">Facebook:</strong>
        <textarea readonly style="width: 100%; height: 100px; margin-top: 5px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;" onclick="this.select()">${shareTexts.facebook}</textarea>
      </div>
      
      <button id="close-share-modal" style="width: 100%; padding: 12px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Close</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close modal events
    const closeBtn = content.querySelector('#close-share-modal');
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
    
    this.showNotification('Click any text area to copy platform-specific text!', 'success');
  }

  fallbackShare() {
    // Copy image to clipboard as fallback
    this.copyImage();
  }

  async copyImage() {
    try {
      this.canvas.toBlob(async (blob) => {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        this.showNotification('Image copied to clipboard!', 'success');
      });
    } catch (error) {
      console.error('Copy image error:', error);
      this.showNotification('Failed to copy image. Try downloading instead.', 'error');
    }
  }

  createAnother() {
    // Clear current poster and go back to main page
    localStorage.removeItem('gccd_poster_data');
    window.location.href = 'index.html';
  }

  viewFullscreen() {
    console.log('Opening fullscreen modal...');
    
    if (!this.fullscreenModal) {
      console.error('Fullscreen modal not found');
      return;
    }
    
    if (!this.canvas) {
      console.error('Main canvas not found');
      return;
    }
    
    // Show the modal
    this.fullscreenModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Update fullscreen canvas with current poster
    setTimeout(() => {
      try {
        if (this.fullscreenCanvas && this.canvas) {
          this.fullscreenCanvas.width = this.canvas.width;
          this.fullscreenCanvas.height = this.canvas.height;
          this.fullscreenCtx.clearRect(0, 0, this.fullscreenCanvas.width, this.fullscreenCanvas.height);
          this.fullscreenCtx.drawImage(this.canvas, 0, 0);
          console.log('Fullscreen canvas updated successfully');
        }
      } catch (error) {
        console.error('Error updating fullscreen canvas:', error);
      }
    }, 50);
    
    this.showNotification('Press Escape or click X to close fullscreen', 'success');
  }

  closeFullscreen() {
    console.log('Closing fullscreen modal...');
    
    if (this.fullscreenModal) {
      this.fullscreenModal.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = message;
      notification.className = `notification ${type}`;
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing PosterResult...');
  new PosterResult();
});

// Handle page unload - clean up resources
window.addEventListener('beforeunload', () => {
  // Clean up any resources if needed
});