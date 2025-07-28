class PosterCreator {
  constructor() {
    this.video = document.getElementById('camera');
    this.posterImg = document.getElementById('poster-bg');
    this.captureBtn = document.getElementById('capture');
    this.sharePreviewBtn = document.getElementById('share-preview');
    this.chips = document.querySelectorAll('.chip');
    this.switchCameraBtn = document.getElementById('switch-camera');
    this.loading = document.getElementById('loading');
    this.statusText = document.getElementById('status-text');
    
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
    // Chip selection - now sets internal selected text only
    this.chips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.chips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        // Store selected text internally
        this.selectedText = chip.dataset.text;
      });
    });

    // Camera controls
    this.switchCameraBtn.addEventListener('click', () => {
      this.switchCamera();
    });

    // Main capture
    this.captureBtn.addEventListener('click', () => {
      this.captureAndCreate();
    });

    // Share preview button  
    this.sharePreviewBtn.addEventListener('click', () => {
      this.shareOnSocialMedia();
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
      const posterWidth = this.posterImg.naturalWidth || this.posterImg.width || 1080;
      const posterHeight = this.posterImg.naturalHeight || this.posterImg.height || 1080;
      
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

      // PERFECTLY CENTERED POSITIONING: Photo positioned at exact center of poster
      const photoX = workingWidth * 0.5;   // 50% from left (perfect center)
      const photoY = workingHeight * 0.5;  // 50% from top (perfect center)
      const photoRadius = Math.min(workingWidth, workingHeight) * 0.18; // Increased from 15% to 18% (20% larger)
      const borderWidth = photoRadius * 0.08; // Blue/green border with padding

      console.log('PERFECTLY CENTERED Photo position:', photoX, photoY, 'radius:', photoRadius);
      console.log('Position percentages: x=50%, y=50%, radius=18% (enlarged from 15%)');

      // Draw blue/green gradient border circle first
      this.ctx.beginPath();
      this.ctx.arc(photoX, photoY, photoRadius + borderWidth, 0, Math.PI * 2, true);
      // Create gradient border (blue to green)
      const gradient = this.ctx.createRadialGradient(photoX, photoY, photoRadius, photoX, photoY, photoRadius + borderWidth);
      gradient.addColorStop(0, '#4285F4'); // Google Blue
      gradient.addColorStop(1, '#34A853'); // Google Green
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Draw circular photo with padding
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(photoX, photoY, photoRadius, 0, Math.PI * 2, true);
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
        photoX - photoRadius, photoY - photoRadius,
        photoRadius * 2, photoRadius * 2
      );

      this.ctx.restore();

      // Position text in the upper left area (where blue oval is marked)
      const text = this.selectedText ? this.selectedText.trim() : '';
      if (text) {
        // Calculate responsive font size
        const fontSize = workingHeight * 0.035; // 3.5% of poster height
        this.ctx.font = `bold ${fontSize}px 'Poppins', 'Inter', sans-serif`;
        this.ctx.fillStyle = '#2D7D32'; // Green color to match design
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = Math.max(3, workingHeight * 0.005); // Thick white stroke
        this.ctx.textAlign = 'left'; // Left align for upper left positioning
        
        // Position text in upper left area (where blue oval is marked)
        const textX = workingWidth * 0.1; // 10% from left (upper left area)
        const textY = workingHeight * 0.25; // 25% from top (upper portion)
        
        console.log('Text position (upper left):', textX, textY, 'Font size:', fontSize);
        console.log('Selected text:', text);
        
        this.ctx.strokeText(text, textX, textY);
        this.ctx.fillText(text, textX, textY);
      }

      // Generate and save poster data with compression
      let posterDataUrl = this.canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
      
      // Check if the data URL is too large for localStorage
      const maxSize = 4 * 1024 * 1024; // 4MB limit
      
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
          const storageScale = Math.min(1, maxWidth / posterWidth);
          const scaledWidth = posterWidth * storageScale;
          const scaledHeight = posterHeight * storageScale;
          
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
      
      // Enable share button
      this.sharePreviewBtn.disabled = false;
      this.sharePreviewBtn.querySelector('span:last-child').textContent = 'Share Created Poster';
      
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

  async shareOnSocialMedia() {
    const posterData = localStorage.getItem('gccd_poster_data');
    if (!posterData) {
      this.showNotification('Please create a poster first!', 'error');
      return;
    }

    // Platform-specific share texts with specific hashtags
    const shareTexts = {
      general: `🎉 Just created my personalized GCCD 2025 poster! Join me at Cloud Community Day Bhopal 2025 🚀\n\n#CCD2025 #CCDBHOPAL #GoogleDeveloperGroups #CloudCommunityDay #TechEvents #Bhopal #GDGBhopal #GoogleCloud`,
      
      twitter: `🎉 Just created my personalized GCCD 2025 poster! Join me at Cloud Community Day Bhopal 2025 🚀\n\n#CCD2025 #CCDBHOPAL #GoogleDeveloperGroups #CloudCommunityDay #TechEvents #Bhopal #GDGBhopal #GoogleCloud #Developer #AI #MachineLearning #CloudComputing`,
      
      instagram: `🎉 Just created my personalized GCCD 2025 poster! Join me at Cloud Community Day Bhopal 2025 🚀\n\n#CCD2025 #CCDBHOPAL #GoogleDeveloperGroups #CloudCommunityDay #TechEvents #Bhopal #GDGBhopal #GoogleCloud #Developer #TechCommunity #CloudComputing #Innovation #TechLife #CodeLife #DeveloperLife`,
      
      linkedin: `🎉 Excited to share my personalized GCCD 2025 poster! Looking forward to Cloud Community Day Bhopal 2025 🚀\n\nJoin me for an amazing day of learning, networking, and innovation in cloud technologies. Connect with fellow developers and tech enthusiasts!\n\n#CCD2025 #CCDBHOPAL #GoogleDeveloperGroups #CloudCommunityDay #TechEvents #Bhopal #GDGBhopal #GoogleCloud #Developer #TechCommunity #CloudComputing #Networking #Innovation #ProfessionalDevelopment #TechCareer`,
      
      facebook: `🎉 Just created my personalized GCCD 2025 poster! Excited for Cloud Community Day Bhopal 2025 🚀\n\nCome join us for an incredible day of tech talks, workshops, and networking with amazing developers and cloud enthusiasts!\n\n#CCD2025 #CCDBHOPAL #GoogleDeveloperGroups #CloudCommunityDay #TechEvents #Bhopal #GDGBhopal #GoogleCloud #TechCommunity #Innovation`
    };
    
    try {
      // Convert data URL to blob
      const response = await fetch(posterData);
      const blob = await response.blob();
      const file = new File([blob], 'gccd-2025-poster.png', { type: 'image/png' });

      // Priority order: Native share > Copy to clipboard > Manual
      if (navigator.share && navigator.canShare({ files: [file] })) {
        // 1. Native sharing with image (highest priority)
        await navigator.share({
          title: 'GCCD 2025 Poster',
          text: shareTexts.general,
          files: [file]
        });
        this.showNotification('Poster shared successfully! 🎉', 'success');
      } else if (navigator.share) {
        // 2. Native sharing without image (fallback)
        await navigator.share({
          title: 'GCCD 2025 Poster',
          text: shareTexts.general,
          url: window.location.href
        });
        this.showNotification('Shared successfully!', 'success');
        // Also copy image to clipboard
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.showNotification('Image also copied to clipboard!', 'success');
      } else {
        // 3. Copy to clipboard (manual fallback)
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.showNotification('Image copied to clipboard! Paste it to share on social media 📋', 'success');
      }
    } catch (error) {
      console.error('Share error:', error);
      this.showNotification('Sharing not supported. Image copied to clipboard!', 'success');
      
      // Fallback: copy to clipboard
      try {
        const response = await fetch(posterData);
        const blob = await response.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch (clipError) {
        console.error('Clipboard error:', clipError);
      }
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