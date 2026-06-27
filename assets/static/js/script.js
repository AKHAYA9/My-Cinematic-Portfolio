let isManualScrolling = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio loaded successfully!');
    
    initNavigation();
    initScrollAnimations();
    initFormHandler();
    initParallax();
    initCounters();
    initDraggableReels();
    initVideoModal();
    initInfoModals();
    removeCloudOverlay();
});

// ============================================
// NAVIGATION FUNCTIONALITY
// ============================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
                if (navToggle && navToggle.classList.contains('active')) {
                    navToggle.classList.remove('active');
                }
                
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Immediately set active state on click and lock it
                isManualScrolling = true;
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');

                // Release lock after scroll completes
                setTimeout(() => {
                    isManualScrolling = false;
                }, 1000);
            }
        });
    });
    
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Update active navigation based on scroll position
    updateActiveNavigation();
    window.addEventListener('scroll', updateActiveNavigation);
}

function updateActiveNavigation() {
    if (isManualScrolling) return;

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    const scrollPosition = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Check if we're at the bottom of the page
    if (scrollPosition + windowHeight >= documentHeight - 100) {
        current = 'contact';
    } else {
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // Tighter detection: section is active if scroll is past its top - 1/3 window height
            if (scrollPosition >= sectionTop - (windowHeight / 3)) {
                current = section.getAttribute('id');
            }
        });
    }
    
    // Ensure home is active at the very top
    if (scrollPosition < 100) {
        current = 'home';
    }
    
    if (current) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                // Trigger counter animation if it's a stat element
                if (entry.target.classList.contains('stat')) {
                    const counter = entry.target.querySelector('.counter');
                    if (counter && !counter.classList.contains('counted')) {
                        animateCounter(counter);
                    }
                }
            }
        });
    }, observerOptions);
    
    // Observe all elements with data-reveal attribute
    const revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach((element) => {
        observer.observe(element);
    });
}

// ============================================
// COUNTER ANIMATION
// ============================================

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        counter.dataset.counted = 'false';
    });
}

function animateCounter(counter) {
    if (counter.dataset.counted === 'true') return;
    
    const target = parseFloat(counter.dataset.target);
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60 FPS
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        
        if (current < target) {
            // Format based on whether it's a decimal
            if (target % 1 !== 0) {
                counter.textContent = current.toFixed(1);
            } else {
                counter.textContent = Math.floor(current);
            }
            requestAnimationFrame(updateCounter);
        } else {
            // Format final value
            if (target % 1 !== 0) {
                counter.textContent = target.toFixed(1) + '+';
            } else {
                counter.textContent = target + '+';
            }
            counter.dataset.counted = 'true';
        }
    };
    
    requestAnimationFrame(updateCounter);
}

// ============================================
// FORM HANDLING
// ============================================

function initFormHandler() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const formData = new FormData(this);
            const submitBtn = document.getElementById('submitBtn');
            const originalBtnContent = submitBtn.innerHTML;
            
            // Update button state
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Sending...';
            
            try {
                const response = await fetch('/contact/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    showNotification('Thank you! Your message has been sent successfully.', 'success');
                    form.reset();
                    // Remove 'focused' class from all groups
                    form.querySelectorAll('.form-group').forEach(group => group.classList.remove('focused'));
                } else {
                    showNotification('Error: ' + data.message, 'error');
                }
            } catch (error) {
                showNotification('Something went wrong. Please try again later.', 'error');
                console.error('Submission error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        });
        
        // Add input animations
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });
        });
    }
}

// Email validation helper
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ============================================
// PARALLAX EFFECTS
// ============================================

function initParallax() {
    let lastScrollTop = 0;
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        lastScrollTop = window.pageYOffset;
        
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateParallax(lastScrollTop);
                ticking = false;
            });
            ticking = true;
        }
    });
}

function updateParallax(scrollTop) {
    const hero = document.querySelector('.hero');
    const heroBackground = document.querySelector('.hero-background');
    
    if (hero && heroBackground) {
        const heroHeight = hero.offsetHeight;
        const scrollPercent = scrollTop / heroHeight;
        
        if (scrollPercent <= 1) {
            // Parallax effect for hero background
            heroBackground.style.transform = `translateY(${scrollTop * 0.5}px)`;
            
            // Fade out hero content
            const heroContent = document.querySelector('.hero-content');
            if (heroContent) {
                heroContent.style.opacity = 1 - scrollPercent;
                heroContent.style.transform = `translateY(${scrollTop * 0.3}px)`;
            }
        }
    }
    
    // Navbar background opacity
    const navbar = document.querySelector('.navbar');
    if (navbar && scrollTop > 100) {
        navbar.style.background = 'rgba(26, 26, 46, 0.98)';
    } else if (navbar) {
        navbar.style.background = 'rgba(26, 26, 46, 0.95)';
    }
}

// ============================================
// CLOUD OVERLAY REMOVAL
// ============================================

function removeCloudOverlay() {
    setTimeout(() => {
        const cloudOverlay = document.getElementById('cloudOverlay');
        if (cloudOverlay) {
            cloudOverlay.style.display = 'none';
        }
    }, 6000);
}

// ============================================
// DRAGGABLE FILM REELS (SKILLS)
// ============================================

let isReelInitialized = false;
function initDraggableReels() {
    if (isReelInitialized) return;
    const slider = document.querySelector('.skills-slider');
    const tracks = document.querySelectorAll('.skills-track');
    
    if (!slider || tracks.length === 0) return;
    isReelInitialized = true;

    const reelState = Array.from(tracks).map((track, index) => ({
        track: track,
        pos: 0,
        speed: index === 0 ? -60 : 60, // Pixels per second
        isDragging: false,
        startX: 0,
        prevTranslate: 0
    }));

    let lastTime = performance.now();

    function updateReels(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        reelState.forEach(state => {
            if (!state.isDragging) {
                state.pos += state.speed * deltaTime;
                
                // Unified infinite wrap logic
                const trackWidth = state.track.offsetWidth / 2;
                if (state.pos <= -trackWidth) state.pos += trackWidth;
                if (state.pos >= 0) state.pos -= trackWidth;
                
                state.track.style.transform = `translateX(${state.pos}px)`;
                state.prevTranslate = state.pos;
            }
        });
        requestAnimationFrame(updateReels);
    }

    requestAnimationFrame(updateReels);

    // Interaction Events
    reelState.forEach(state => {
        const track = state.track;

        const startDragging = (e) => {
            state.isDragging = true;
            state.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            state.prevTranslate = state.pos;
            slider.classList.add('active');
        };

        const dragging = (e) => {
            if (!state.isDragging) return;
            const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            const walk = (currentX - state.startX) * 1.2; // Adjusted sensitivity
            state.pos = state.prevTranslate + walk;
            
            // Wrap during drag to keep pos in range [-trackWidth, 0]
            const trackWidth = state.track.offsetWidth / 2;
            while (state.pos <= -trackWidth) state.pos += trackWidth;
            while (state.pos >= 0) state.pos -= trackWidth;

            state.track.style.transform = `translateX(${state.pos}px)`;
        };

        const stopDragging = () => {
            state.isDragging = false;
            slider.classList.remove('active');
            // Update lastTime to prevent huge deltaTime jump after drag
            lastTime = performance.now();
        };

        track.addEventListener('mousedown', startDragging);
        window.addEventListener('mousemove', dragging);
        window.addEventListener('mouseup', stopDragging);

        track.addEventListener('touchstart', startDragging, { passive: true });
        window.addEventListener('touchmove', dragging, { passive: true });
        window.addEventListener('touchend', stopDragging);
    });
}

// ============================================
// VIDEO MODAL HANDLER (Bootstrap)
// ============================================

function initVideoModal() {
    const modalEl = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const portfolioItems = document.querySelectorAll('.portfolio-item[data-video]');

    if (!modalEl || !modalVideo) return;

    // Initialize Bootstrap Modal
    const bsModal = new bootstrap.Modal(modalEl);

    portfolioItems.forEach(item => {
        item.addEventListener('click', () => {
            const videoUrl = item.getAttribute('data-video');
            if (videoUrl) {
                modalVideo.querySelector('source').src = videoUrl;
                modalVideo.load();
                bsModal.show();
            }
        });
    });

    // Auto-play when modal is shown
    modalEl.addEventListener('shown.bs.modal', () => {
        modalVideo.play();
    });

    // Stop and clear when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
        modalVideo.pause();
        modalVideo.querySelector('source').src = '';
    });
}

// ============================================
// PORTFOLIO ITEM INTERACTIONS
// ============================================

// Add click handlers for portfolio items
document.addEventListener('DOMContentLoaded', function() {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    portfolioItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent;
            console.log(`Portfolio item clicked: ${title}`);
            // You can add modal functionality or navigation here
        });
    });
});

// ============================================
// SKILL CARD INTERACTIONS
// ============================================

// Skill Card Hover Handled via CSS for Performance

// ============================================
// SMOOTH SCROLL POLYFILL FOR OLDER BROWSERS
// ============================================

if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothScrollPolyfill = function(target) {
        const targetPosition = target.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 1000;
        let start = null;
        
        const animation = function(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };
        
        const ease = function(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };
        
        requestAnimationFrame(animation);
    };
    
    // Apply to all smooth scroll links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) smoothScrollPolyfill(target);
        });
    });
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

// Debounce function for scroll events
function debounce(func, wait = 20, immediate = true) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Apply debounce to scroll-heavy functions
window.addEventListener('scroll', debounce(function() {
    // Additional scroll-based functionality can be added here
}, 20));

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    }
});

// Focus management for better accessibility
const focusableElements = document.querySelectorAll(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
);

focusableElements.forEach(element => {
    element.addEventListener('focus', function() {
        this.style.outline = '2px solid #87CEEB';
        this.style.outlineOffset = '2px';
    });
    
    element.addEventListener('blur', function() {
        this.style.outline = '';
        this.style.outlineOffset = '';
    });
});

// ============================================
// CSS ANIMATION STYLES (Injected)
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// PRIVACY & TERMS MODALS
// ============================================

function initInfoModals() {
    const infoModal = document.getElementById('infoModal');
    const infoModalTitle = document.getElementById('infoModalTitle');
    const infoModalBody = document.getElementById('infoModalBody');
    const infoModalClose = document.getElementById('infoModalClose');
    const infoModalOverlay = infoModal ? infoModal.querySelector('.info-modal-overlay') : null;
    
    const privacyLink = document.getElementById('privacyLink');
    const termsLink = document.getElementById('termsLink');

    if (!infoModal || !infoModalTitle || !infoModalBody) return;

    const modalContent = {
        privacy: {
            title: 'Privacy Policy',
            body: `
                <h4>1. Information Collection</h4>
                <p>We collect minimal information required to provide our services. This may include your name and email address if you use our contact form.</p>
                
                <h4>2. Use of Information</h4>
                <p>Any information we collect is used solely for communication and improving the user experience on this portfolio.</p>
                
                <h4>3. Data Protection</h4>
                <p>We implement industry-standard security measures to protect your data. We do not sell or share your personal information with third parties.</p>
                
                <h4>4. Cookies</h4>
                <p>This site may use essential cookies to enhance performance and track basic analytics without identifying individual users.</p>
            `
        },
        terms: {
            title: 'Terms of Service',
            body: `
                <h4>1. Acceptance of Terms</h4>
                <p>By accessing this portfolio, you agree to comply with and be bound by these terms of service.</p>
                
                <h4>2. Intellectual Property</h4>
                <p>All content, projects, and designs showcased here are the intellectual property of Portfolio Owner unless otherwise stated.</p>
                
                <h4>3. Use License</h4>
                <p>You may view the content for personal, non-commercial purposes. Redistribution or reproduction without prior consent is prohibited.</p>
                
                <h4>4. Disclaimer</h4>
                <p>The projects shown are for demonstration purposes. We are not liable for any issues arising from the use of the information provided here.</p>
            `
        }
    };

    function openModal(type) {
        const data = modalContent[type];
        infoModalTitle.textContent = data.title;
        infoModalBody.innerHTML = data.body;
        infoModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeModal() {
        infoModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('privacy');
        });
    }

    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('terms');
        });
    }

    if (infoModalClose) infoModalClose.addEventListener('click', closeModal);
    if (infoModalOverlay) infoModalOverlay.addEventListener('click', closeModal);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// ============================================
// GOOGLE AUTOFILL CREDENTIAL HANDLER
// ============================================

function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

window.handleCredentialResponse = function(response) {
    try {
        const responsePayload = decodeJwtResponse(response.credential);
        
        // Find fields
        const nameInput = document.querySelector('input[name="name"]');
        const emailInput = document.querySelector('input[name="email"]');
        const messageInput = document.querySelector('textarea[name="message"]');
        
        if (nameInput) {
            nameInput.value = responsePayload.name;
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (emailInput) {
            emailInput.value = responsePayload.email;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (messageInput) {
            const firstName = responsePayload.given_name || responsePayload.name;
            messageInput.value = `hlo this side ${firstName} and I am interested in your portfolio projects. Let's connect!`;
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        console.log('Form autofilled with Google profile details!');
    } catch (e) {
        console.error('Error handling Google credential response:', e);
        alert('Failed to retrieve profile details from Google: ' + e.message);
    }
};