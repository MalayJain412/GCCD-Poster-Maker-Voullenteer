class PosterResult {
  constructor() {
    this.canvas = document.getElementById('final-poster');
    this.ctx = this.canvas.getContext('2d');
    this.fullscreenCanvas = document.getElementById('fullscreen-canvas');
    this.fullscreenCtx = this.fullscreenCanvas.getContext('2d');
    this.fullscreenModal = document.getElementById('fullscreen-modal');
    
    // Buttons
    this.retakeBtn = document.getElementById('retake');
    this.downloadHdBtn = document.getElementById('download-hd');
    this.downloadWebBtn = document.getElementById('download-web');
    this.shareNativeBtn = document.getElementById('share-native');
    this.copyLinkBtn = document.getElementById('copy-link');
    this.copyImageBtn = document.getElementById('copy-image');
    this.createAnotherBtn = document.getElementById('create-another');
    this.viewFullscreenBtn = document.getElementById('view-fullscreen');
    this.closeModalBtn = document.getElementById('close-modal');
    
    this.init();
  }

  init() {
    this.loadPosterFromStorage();
    this.bindEvents();
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
    this.retakeBtn.addEventListener('click', () => {
      this.goBack();
    });

    // Download buttons
    this.downloadHdBtn.addEventListener('click', () => {
      this.downloadPoster('hd');
    });

    this.downloadWebBtn.addEventListener('click', () => {
      this.downloadPoster('web');
    });

    // Share buttons
    this.shareNativeBtn.addEventListener('click', () => {
      this.sharePoster();
    });

    this.copyLinkBtn.addEventListener('click', () => {
      this.copyLink();
    });

    this.copyImageBtn.addEventListener('click', () => {
      this.copyImage();
    });

    // Quick actions
    this.createAnotherBtn.addEventListener('click', () => {
      this.createAnother();
    });

    this.viewFullscreenBtn.addEventListener('click', () => {
      this.viewFullscreen();
    });

    // Modal controls
    this.closeModalBtn.addEventListener('click', () => {
      this.closeFullscreen();
    });

    this.fullscreenModal.addEventListener('click', (e) => {
      if (e.target === this.fullscreenModal) {
        this.closeFullscreen();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeFullscreen();
      } else if (e.key === 'f' || e.key === 'F') {
        this.viewFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.downloadPoster('hd');
      }
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
      if (navigator.share && navigator.canShare) {
        this.canvas.toBlob(async (blob) => {
          const file = new File([blob], 'gccd-2025-poster.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'GCCD 2025 Poster',
              text: 'Check out my Cloud Community Day 2025 poster! 🚀',
              files: [file]
            });
            this.showNotification('Poster shared successfully!', 'success');
          } else {
            this.fallbackShare();
          }
        });
      } else {
        this.fallbackShare();
      }
    } catch (error) {
      console.error('Share error:', error);
      this.fallbackShare();
    }
  }

  fallbackShare() {
    // Copy image to clipboard as fallback
    this.copyImage();
  }

  async copyLink() {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      this.showNotification('Link copied to clipboard!', 'success');
    } catch (error) {
      console.error('Copy link error:', error);
      this.showNotification('Failed to copy link.', 'error');
    }
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
    this.fullscreenModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeFullscreen() {
    this.fullscreenModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PosterResult();
});

// Handle page unload - clean up resources
window.addEventListener('beforeunload', () => {
  // Clean up any resources if needed
});