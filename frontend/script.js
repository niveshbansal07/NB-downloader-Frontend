// NB Downloader Frontend JavaScript
class NBDownloader {
    constructor() {
        this.apiBaseUrl = this.getApiBaseUrl();
        this.currentVideoUrl = '';
        this.isProcessing = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeAnimations();
    }

    getApiBaseUrl() {
        // In development, use localhost. In production, this should be your deployed backend URL
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }
        // For production, you would set this to your actual backend URL
        return 'https://nb-downloader-backend.onrender.com'; // Replace with actual backend URL
    }

    initializeElements() {
        // Form elements
        this.videoUrlInput = document.getElementById('videoUrl');
        this.previewBtn = document.getElementById('previewBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressStatus = document.getElementById('progressStatus');
        this.progressPercent = document.getElementById('progressPercent');
        
        // Preview elements
        this.previewSection = document.getElementById('previewSection');
        this.videoThumbnail = document.getElementById('videoThumbnail');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoUploader = document.getElementById('videoUploader');
        this.videoDuration = document.getElementById('videoDuration');
        this.videoViews = document.getElementById('videoViews');
        this.videoLikes = document.getElementById('videoLikes');
        this.videoQualities = document.getElementById('videoQualities');
        this.closePreview = document.getElementById('closePreview');
        this.downloadFromPreview = document.getElementById('downloadFromPreview');
        
        // Overlay elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
    }

    bindEvents() {
        // Form events
        this.previewBtn.addEventListener('click', () => this.handlePreview());
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        this.downloadFromPreview.addEventListener('click', () => this.handleDownload());
        
        // Input events
        this.videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handlePreview();
            }
        });
        
        this.videoUrlInput.addEventListener('focus', () => {
            this.videoUrlInput.classList.add('focused');
        });
        
        this.videoUrlInput.addEventListener('blur', () => {
            this.videoUrlInput.classList.remove('focused');
        });
        
        // Preview events
        this.closePreview.addEventListener('click', () => this.hidePreview());
        
        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target === this.errorModal) {
                this.closeErrorModal();
            }
        });
        
        // Navigation events
        this.initializeNavigation();
    }

    initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');
        
        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                    
                    // Update active nav link
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
        
        // Update active nav link on scroll
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.pageYOffset >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    initializeAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        const animateElements = document.querySelectorAll('.feature-card, .about-content p');
        animateElements.forEach(el => observer.observe(el));
    }

    validateUrl(url) {
        if (!url) {
            throw new Error('Please enter a YouTube URL');
        }
        
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeRegex.test(url)) {
            throw new Error('Please enter a valid YouTube URL');
        }
        
        return url;
    }

    async handlePreview() {
        try {
            const url = this.validateUrl(this.videoUrlInput.value.trim());
            this.currentVideoUrl = url;
            
            this.showLoading('Getting video information...');
            
            const response = await fetch(`${this.apiBaseUrl}/preview?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to get video information');
            }
            
            this.hideLoading();
            this.displayPreview(data.data);
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    async handleDownload() {
        if (this.isProcessing) return;
        
        try {
            const url = this.currentVideoUrl || this.validateUrl(this.videoUrlInput.value.trim());
            this.currentVideoUrl = url;
            
            this.isProcessing = true;
            this.showProgress();
            this.updateProgress(0, 'Starting download...');
            
            // Simulate progress updates (in a real implementation, you'd use WebSockets or Server-Sent Events)
            const progressInterval = setInterval(() => {
                const currentProgress = parseInt(this.progressFill.style.width) || 0;
                if (currentProgress < 90) {
                    this.updateProgress(currentProgress + Math.random() * 10, 'Downloading video...');
                }
            }, 1000);
            
            // Create download link
            const downloadUrl = `${this.apiBaseUrl}/download?url=${encodeURIComponent(url)}`;
            
            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Update progress to completion
            clearInterval(progressInterval);
            this.updateProgress(100, 'Download completed!');
            
            setTimeout(() => {
                this.hideProgress();
                this.isProcessing = false;
            }, 2000);
            
        } catch (error) {
            this.hideProgress();
            this.isProcessing = false;
            this.showError(error.message);
        }
    }

    displayPreview(videoData) {
        // Set video information
        this.videoThumbnail.src = videoData.thumbnail || '';
        this.videoThumbnail.alt = videoData.title;
        this.videoTitle.textContent = videoData.title;
        this.videoUploader.textContent = `by ${videoData.uploader}`;
        this.videoDuration.textContent = videoData.duration;
        
        // Format stats
        this.videoViews.textContent = this.formatNumber(videoData.view_count) + ' views';
        this.videoLikes.textContent = this.formatNumber(videoData.like_count) + ' likes';
        
        // Display quality badges
        this.videoQualities.innerHTML = '';
        if (videoData.formats && videoData.formats.length > 0) {
            videoData.formats.forEach(quality => {
                const badge = document.createElement('span');
                badge.className = 'quality-badge';
                badge.textContent = quality;
                this.videoQualities.appendChild(badge);
            });
        } else {
            const badge = document.createElement('span');
            badge.className = 'quality-badge';
            badge.textContent = 'Best Quality';
            this.videoQualities.appendChild(badge);
        }
        
        // Show preview section
        this.previewSection.classList.remove('hidden');
        this.previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    hidePreview() {
        this.previewSection.classList.add('hidden');
    }

    showLoading(message = 'Processing...') {
        this.loadingOverlay.classList.remove('hidden');
        const loadingText = this.loadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    showProgress() {
        this.progressSection.classList.remove('hidden');
        this.progressSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideProgress() {
        this.progressSection.classList.add('hidden');
        this.progressFill.style.width = '0%';
    }

    updateProgress(percent, status) {
        this.progressFill.style.width = `${percent}%`;
        this.progressStatus.textContent = status;
        this.progressPercent.textContent = `${Math.round(percent)}%`;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.classList.remove('hidden');
    }

    closeErrorModal() {
        this.errorModal.classList.add('hidden');
    }

    formatNumber(num) {
        if (!num) return '0';
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Utility method for making API calls with error handling
    async makeApiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    }
}

// Global function for error modal (accessible from HTML)
window.closeErrorModal = function() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        errorModal.classList.add('hidden');
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new NBDownloader();
    
    // Add some additional UI enhancements
    app.addUIEnhancements = function() {
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        // Add smooth hover effects to feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    };
    
    app.addUIEnhancements();
    
    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .btn {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .animate-in {
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .feature-card {
            opacity: 0;
            transform: translateY(30px);
        }
        
        .feature-card.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
});

// Add service worker for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}


