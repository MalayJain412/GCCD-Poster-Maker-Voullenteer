class PosterCreator {
  constructor() {
    this.video = document.getElementById('camera');
    this.posterImg = document.getElementById('poster-bg');
    this.captureBtn = document.getElementById('capture');
    this.customText = document.getElementById('custom-text');
    this.chips = document.querySelectorAll('.chip');
    this.switchCameraBtn = document.getElementById('switch-camera');
    this.takePhotoBtn = document.getElementById('take-photo');
    this.loading = document.getElementById('loading');
    this.statusText = document.getElementById('status-text');
    this.charCount = document.getElementById('char-count');
    
    this.currentStream = null;
    this.facingMode = 'user';
    
    // Create a hidden canvas for processing
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.init();
  }

  async init() {
    await this.startCamera();
    this.bindEvents();
    this.setupCanvas();
  }

  async startCamera() {
    try {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      this.video.srcObject = stream;
      this.currentStream = stream;
      this.statusText.textContent = 'Camera Ready';
      this.showNotification('Camera initialized successfully!', 'success');
    } catch (err) {
      console.error('Camera error:', err);
      this.statusText.textContent = 'Camera Error';
      this.showNotification('Camera access denied. Please enable camera permissions.', 'error');
    }
  }

  bindEvents() {
    // Chip selection
    this.chips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.chips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.customText.value = chip.dataset.text;
        this.updateCharCount();
      });
    });

    // Character counter
    this.customText.addEventListener('input', () => {
      this.updateCharCount();
    });

    // Camera controls
    this.switchCameraBtn.addEventListener('click', () => {
      this.switchCamera();
    });

    this.takePhotoBtn.addEventListener('click', () => {
      this.previewPhoto();
    });

    // Main capture
    this.captureBtn.addEventListener('click', () => {
      this.captureAndCreate();
    });

    // Setup canvas when poster loads
    this.posterImg.onload = () => {
      console.log('Poster image loaded successfully');
      this.setupCanvas();
    };
    
    this.posterImg.onerror = () => {
      console.error('Failed to load poster image');
      this.showNotification('Failed to load poster image. Please refresh the page.', 'error');
    };
    
    // If image is already loaded
    if (this.posterImg.complete) {
      this.setupCanvas();
    }
  }

  updateCharCount() {
    const count = this.customText.value.length;
    this.charCount.textContent = count;
    this.charCount.style.color = count > 45 ? '#EA4335' : '#666';
  }

  setupCanvas() {
    if (this.posterImg.complete && this.posterImg.naturalWidth > 0) {
      this.canvas.width = this.posterImg.naturalWidth;
      this.canvas.height = this.posterImg.naturalHeight;
      console.log('Canvas setup complete:', this.canvas.width, 'x', this.canvas.height);
    } else {
      console.log('Poster image not ready yet');
      // Retry after a short delay
      setTimeout(() => this.setupCanvas(), 100);
    }
  }

  async switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    await this.startCamera();
    this.showNotification('Camera switched!', 'success');
  }

  previewPhoto() {
    // Add a flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.8;
    `;
    document.body.appendChild(flash);
    
    setTimeout(() => {
      document.body.removeChild(flash);
    }, 150);
    
    this.showNotification('Photo preview captured!', 'success');
  }

  async captureAndCreate() {
    // Check if poster image is loaded
    if (!this.posterImg.complete || this.posterImg.naturalWidth === 0) {
      this.showNotification('Poster image not loaded yet. Please wait...', 'error');
      return;
    }

    // Check if video is ready
    if (!this.video.srcObject || this.video.videoWidth === 0) {
      this.showNotification('Camera not ready. Please allow camera access.', 'error');
      return;
    }

    this.loading.style.display = 'flex';
    this.captureBtn.disabled = true;
    this.captureBtn.textContent = 'Creating Poster...';
    
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Get poster dimensions
      const posterWidth = this.posterImg.naturalWidth || this.posterImg.width || 600;
      const posterHeight = this.posterImg.naturalHeight || this.posterImg.height || 800;
      
      console.log('Poster dimensions:', posterWidth, 'x', posterHeight);
      console.log('Video dimensions:', this.video.videoWidth, 'x', this.video.videoHeight);
      
      // For very large posters, work with a smaller canvas initially
      const maxWorkingSize = 2400; // Max width/height for working canvas
      const scale = Math.min(1, maxWorkingSize / Math.max(posterWidth, posterHeight));
      const workingWidth = posterWidth * scale;
      const workingHeight = posterHeight * scale;
      
      console.log('Working dimensions:', workingWidth, 'x', workingHeight, 'Scale:', scale);
      
      // Set canvas size to working dimensions
      this.canvas.width = workingWidth;
      this.canvas.height = workingHeight;

      // Clear canvas
      this.ctx.clearRect(0, 0, workingWidth, workingHeight);

      // Draw poster background (scaled)
      this.ctx.drawImage(this.posterImg, 0, 0, workingWidth, workingHeight);

      // Calculate selfie position based on working dimensions to match the black circle
      const x = workingWidth * 0.5; // Center horizontally (black circle is centered)
      const y = workingHeight * 0.32; // Moved up to 0.32 as requested
      const radius = Math.min(workingWidth, workingHeight) * 0.11; // Increased size to fill the black circle better

      console.log('Selfie position:', x, y, 'radius:', radius);
      console.log('Position percentages: x=50%, y=32%, radius=11%');

      // Draw circular selfie
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      this.ctx.closePath();
      this.ctx.clip();

      // Get video dimensions and calculate crop
      const videoWidth = this.video.videoWidth;
      const videoHeight = this.video.videoHeight;
      
      if (videoWidth === 0 || videoHeight === 0) {
        throw new Error('Video dimensions are invalid');
      }

      const side = Math.min(videoWidth, videoHeight);
      const sx = (videoWidth - side) / 2;
      const sy = (videoHeight - side) / 2;

      // Draw video frame
      this.ctx.drawImage(
        this.video,
        sx, sy, side, side,
        x - radius, y - radius,
        radius * 2, radius * 2
      );

      this.ctx.restore();

      // Add custom text with better styling (positioned at bottom)
      const text = this.customText.value.trim();
      if (text) {
        this.ctx.font = `bold ${workingHeight * 0.025}px 'Poppins', 'Inter', sans-serif`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = Math.max(2, workingHeight * 0.003); // Scale line width
        this.ctx.textAlign = 'center';
        
        // Position text at the bottom of the poster
        const textY = workingHeight - (workingHeight * 0.06);
        this.ctx.strokeText(text, workingWidth / 2, textY);
        this.ctx.fillText(text, workingWidth / 2, textY);
      }

      // Generate and save poster data with compression
      // First try with lower quality to reduce size
      let posterDataUrl = this.canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
      
      // Check if the data URL is too large for localStorage
      const maxSize = 4 * 1024 * 1024; // 4MB limit (localStorage is usually 5-10MB)
      
      if (posterDataUrl.length > maxSize) {
        console.log('Image too large, compressing further...');
        posterDataUrl = this.canvas.toDataURL('image/jpeg', 0.6); // 60% quality
        
        if (posterDataUrl.length > maxSize) {
          console.log('Still too large, creating smaller version...');
          // Create a smaller canvas for storage
          const storageCanvas = document.createElement('canvas');
          const storageCtx = storageCanvas.getContext('2d');
          
          // Scale down to max 1200px width while maintaining aspect ratio
          const maxWidth = 1200;
          const scale = Math.min(1, maxWidth / posterWidth);
          const scaledWidth = posterWidth * scale;
          const scaledHeight = posterHeight * scale;
          
          storageCanvas.width = scaledWidth;
          storageCanvas.height = scaledHeight;
          
          // Draw the full-size canvas to the smaller canvas
          storageCtx.drawImage(this.canvas, 0, 0, scaledWidth, scaledHeight);
          posterDataUrl = storageCanvas.toDataURL('image/jpeg', 0.8);
          
          console.log('Compressed to:', scaledWidth, 'x', scaledHeight);
        }
      }
      
      if (!posterDataUrl || posterDataUrl === 'data:,') {
        throw new Error('Failed to generate poster image data');
      }

      console.log('Final data URL size:', (posterDataUrl.length / 1024 / 1024).toFixed(2), 'MB');
      localStorage.setItem('gccd_poster_data', posterDataUrl);
      
      this.showNotification('Poster created! Redirecting...', 'success');
      
      // Redirect to poster result page
      setTimeout(() => {
        window.location.href = 'poster-result.html';
      }, 1000);
      
    } catch (error) {
      console.error('Capture error details:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to create poster. ';
      if (error.message.includes('Video dimensions')) {
        errorMessage += 'Camera not ready. Please try again.';
      } else if (error.message.includes('poster image data')) {
        errorMessage += 'Image generation failed. Please try again.';
      } else {
        errorMessage += 'Please check your camera permissions and try again.';
      }
      
      this.showNotification(errorMessage, 'error');
      this.captureBtn.disabled = false;
      this.captureBtn.textContent = 'Capture & Create Poster';
    } finally {
      this.loading.style.display = 'none';
    }
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PosterCreator();
});

// Handle page visibility changes to optimize performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause video when tab is not visible to save resources
    const video = document.getElementById('camera');
    if (video && video.srcObject) {
      video.srcObject.getVideoTracks().forEach(track => {
        track.enabled = false;
      });
    }
  } else {
    // Resume video when tab becomes visible
    const video = document.getElementById('camera');
    if (video && video.srcObject) {
      video.srcObject.getVideoTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }
});

// Handle page unload - clean up camera resources
window.addEventListener('beforeunload', () => {
  const video = document.getElementById('camera');
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
});