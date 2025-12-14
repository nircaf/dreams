// Cosmic Sleep Landing Page - Interactive Scripts

document.addEventListener('DOMContentLoaded', function() {
    // Create parallax background
    setupParallaxBackground();
    
    // Setup orbit animations
    setupOrbits();
    
    // Add particle effects on mouse move
    setupParticles();
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('header nav a, a.cta-button');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Header scroll effect
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        if (currentScroll > 100) {
            header.style.padding = '1rem 0';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.padding = '1.5rem 0';
            header.style.boxShadow = 'none';
        }
        
        // Parallax scroll effect
        updateParallax();
        
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });
    
    // Form submission handling with email validation and local storage
    const waitlistForm = document.querySelector('.waitlist-form');
    const heroButton = document.querySelector('#hero .cta-button');
    
    // Add click event to the hero CTA button to scroll to waitlist
    if (heroButton) {
        heroButton.addEventListener('click', function() {
            const waitlistSection = document.querySelector('#waitlist');
            if (waitlistSection) {
                window.scrollTo({
                    top: waitlistSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Waitlist count logic - decreases by 1 or 2 on each refresh, stops at 3
    // Only decreases if at least 1 hour has passed since last decrease
    const waitlistCountElement = document.getElementById('waitlist-count');
    if (waitlistCountElement) {
        let currentCount = parseInt(localStorage.getItem('waitlistPlacesLeft'), 10);
        const lastDecreaseTime = parseInt(localStorage.getItem('waitlistLastDecreaseTime'), 10);
        const currentTime = Date.now();
        const oneHourInMs = 3600000; // 1 hour in milliseconds
        
        // Initialize to 25 if not set
        if (isNaN(currentCount)) {
            currentCount = 25;
        }
        
        // Decrease by 1 or 2 randomly if count is greater than 3 and at least 1 hour has passed
        if (currentCount > 3) {
            // Check if enough time has passed (or if this is the first time)
            if (isNaN(lastDecreaseTime) || (currentTime - lastDecreaseTime >= oneHourInMs)) {
                const decreaseAmount = Math.random() < 0.5 ? 1 : 2;
                currentCount = Math.max(3, currentCount - decreaseAmount);
                localStorage.setItem('waitlistPlacesLeft', currentCount);
                localStorage.setItem('waitlistLastDecreaseTime', currentTime);
            }
        }
        
        // Update the display
        waitlistCountElement.textContent = `${currentCount} places left in the waiting list`;
        
        // Position the text centered on the button's center
        const heroButton = document.querySelector('#hero .cta-button');
        if (heroButton) {
            const buttonRect = heroButton.getBoundingClientRect();
            const containerRect = heroButton.parentElement.getBoundingClientRect();
            const buttonCenter = buttonRect.left - containerRect.left + (buttonRect.width / 2);
            waitlistCountElement.style.marginLeft = `${buttonCenter}px`;
            waitlistCountElement.style.transform = 'translateX(-50%)';
        }
    }
    
    if (waitlistForm) {
        // Load any existing emails from local storage
        const displayExistingEmails = function() {
            const emailCount = localStorage.getItem('waitlistCount') || 0;
            if (emailCount > 0) {
                const statusElement = document.createElement('div');
                statusElement.className = 'waitlist-status';
                statusElement.innerHTML = `
                    <p>${emailCount} ${emailCount == 1 ? 'person has' : 'people have'} joined the waitlist</p>
                    <button class="view-waitlist-btn">View Waitlist</button>
                `;
                
                // Insert after the form
                waitlistForm.parentNode.insertBefore(statusElement, waitlistForm.nextSibling);
                
                // Add click handler for the view button
                document.querySelector('.view-waitlist-btn').addEventListener('click', function() {
                    const waitlistData = JSON.parse(localStorage.getItem('waitlistEmails') || '[]');
                    const waitlistPreview = document.createElement('div');
                    waitlistPreview.className = 'waitlist-preview';
                    
                    if (waitlistData.length === 0) {
                        waitlistPreview.innerHTML = '<p>No emails in waitlist yet.</p>';
                    } else {
                        let emailList = '<div class="email-list">';
                        waitlistData.forEach(item => {
                            emailList += `<div class="email-item">
                                <span class="email">${item.email}</span>
                                <span class="date">${item.date}</span>
                            </div>`;
                        });
                        emailList += '</div>';
                        
                        waitlistPreview.innerHTML = `
                            <h3>Waitlist Entries (${waitlistData.length})</h3>
                            ${emailList}
                            <button class="close-preview">Close</button>
                        `;
                    }
                    
                    document.body.appendChild(waitlistPreview);
                    
                    // Add close handler
                    waitlistPreview.querySelector('.close-preview').addEventListener('click', function() {
                        waitlistPreview.remove();
                    });
                });
            }
        };
        
        // Display existing email count on page load
        displayExistingEmails();
        
        // Form submission
        waitlistForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            // Simple email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && emailRegex.test(email)) {
                // Get existing waitlist data from localStorage
                let waitlistData = JSON.parse(localStorage.getItem('waitlistEmails') || '[]');
                const currentDate = new Date().toISOString().split('T')[0];
                
                // Add the new email with timestamp
                waitlistData.push({
                    email: email,
                    date: currentDate
                });
                
                // Save to localStorage
                localStorage.setItem('waitlistEmails', JSON.stringify(waitlistData));
                localStorage.setItem('waitlistCount', waitlistData.length);
                
                // Simulate server-side saving
                console.log('Email saved to waitlist: ' + email);
                console.log('Total entries in waitlist: ' + waitlistData.length);
                
                // Update the UI to show success
                const originalFormHTML = waitlistForm.innerHTML;
                waitlistForm.innerHTML = '<p class="success-message">Thank you for joining our waitlist! Your information has been saved.</p>';
                
                // Create celebration particles
                if (typeof createCelebrationParticles === 'function') {
                    createCelebrationParticles();
                }
                
                // Optionally restore the form after a delay
                setTimeout(() => {
                    waitlistForm.innerHTML = originalFormHTML;
                    // Re-attach the event listener
                    waitlistForm.addEventListener('submit', arguments.callee);
                    
                    // Update the display of existing emails
                    const existingStatus = document.querySelector('.waitlist-status');
                    if (existingStatus) {
                        existingStatus.remove();
                    }
                    displayExistingEmails();
                    
                }, 5000);
            } else {
                // Show error for invalid email
                const errorMsg = document.createElement('p');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'Please enter a valid email address.';
                
                // Remove any existing error message before adding new one
                const existingError = waitlistForm.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                waitlistForm.appendChild(errorMsg);
            }
        });
    }
    
    // Animation for elements when they come into view
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.fade-in');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.classList.add('visible');
            }
        });
    };
    
    // Add fade-in class to elements that should animate
    const elementsToAnimate = document.querySelectorAll('.feature-card, .step, .science-card, h2, .hero-content h1, .hero-content p, .cta-button');
    elementsToAnimate.forEach(element => {
        element.classList.add('fade-in');
    });
    
    // Run animation on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Run once on load
    setTimeout(animateOnScroll, 100);

    // Gallery logic (agnostic to number of files)
    const galleryGrid = document.getElementById('gallery-grid');
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    const closeBtn = document.querySelector('.gallery-modal-close');

    if (galleryGrid && modal && modalImg && closeBtn) {
        const exts = ['jpg','jpeg','png','gif','webp'];
        const MAX_IMAGES = 50;
        let foundAny = false;
        let tryCount = 0;
        let lastScrollY = 0;

        function tryLoadImage(idx, extIdx) {
            if (extIdx >= exts.length) {
                if (idx < MAX_IMAGES) tryLoadImage(idx+1, 0);
                else if (!foundAny && tryCount >= MAX_IMAGES*exts.length) {
                    galleryGrid.innerHTML = "<p>No images found in Gallery folder.</p>";
                }
                return;
            }
            tryCount++;
            const img = new window.Image();
            img.className = "gallery-thumb";
            img.alt = `Gallery Image ${idx}`;
            img.src = `Gallery/${idx}.${exts[extIdx]}`; // Set src first!
            img.onload = function() {
                foundAny = true;
                galleryGrid.appendChild(img);
                // Attach click handler only after image is loaded and appended
                img.addEventListener('click', function() {
                    lastScrollY = window.scrollY;
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${lastScrollY}px`;
                    document.body.style.left = '0';
                    document.body.style.right = '0';
                    document.body.style.width = '100%';

                    modal.style.display = "flex";
                    modal.style.zIndex = "2000";
                    modalImg.src = img.src;
                    modalImg.alt = img.alt;
                    modalImg.style.maxWidth = "90vw";
                    modalImg.style.maxHeight = "80vh";
                });
                if (idx < MAX_IMAGES) tryLoadImage(idx+1, 0);
            };
            img.onerror = function() {
                tryLoadImage(idx, extIdx+1);
            };
        }
        tryLoadImage(1, 0);

        function closeModal() {
            modal.style.display = "none";
            modalImg.src = "";
            modalImg.alt = "";
            // Restore scroll position and allow scrolling
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            window.scrollTo(0, lastScrollY);
        }

        closeBtn.onclick = closeModal;
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeModal();
            }
        };
    }
});

// Setup Parallax Background
function setupParallaxBackground() {
    // Create parallax wrapper
    const parallaxWrapper = document.createElement('div');
    parallaxWrapper.className = 'parallax-wrapper';
    
    // Create star layers
    const starsSmall = document.createElement('div');
    starsSmall.className = 'stars-small';
    
    const starsMedium = document.createElement('div');
    starsMedium.className = 'stars-medium';
    
    const starsLarge = document.createElement('div');
    starsLarge.className = 'stars-large';
    
    const nebulaLayer = document.createElement('div');
    nebulaLayer.className = 'nebula-layer';
    
    // Append all layers to the parallax wrapper
    parallaxWrapper.appendChild(starsSmall);
    parallaxWrapper.appendChild(starsMedium);
    parallaxWrapper.appendChild(starsLarge);
    parallaxWrapper.appendChild(nebulaLayer);
    
    // Add parallax wrapper to body
    document.body.prepend(parallaxWrapper);
    
    // Add orbit container to hero section
    const heroSection = document.getElementById('hero');
    if (heroSection) {
        const heroBackground = document.createElement('div');
        heroBackground.className = 'hero-bg';
        heroSection.prepend(heroBackground);
    }
}

// Update Parallax Effect on Scroll
function updateParallax() {
    const scrollY = window.scrollY;
    
    // Select all parallax elements
    const starsSmall = document.querySelector('.stars-small');
    const starsMedium = document.querySelector('.stars-medium');
    const starsLarge = document.querySelector('.stars-large');
    const nebulaLayer = document.querySelector('.nebula-layer');
    
    if (starsSmall && starsMedium && starsLarge && nebulaLayer) {
        // Apply parallax effect with different speeds
        starsSmall.style.transform = `translateY(${scrollY * 0.1}px)`;
        starsMedium.style.transform = `translateY(${scrollY * 0.2}px)`;
        starsLarge.style.transform = `translateY(${scrollY * 0.3}px)`;
        nebulaLayer.style.transform = `translateY(${scrollY * 0.05}px)`;
    }
    
    // Apply parallax to other elements
    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroContent && heroImage && scrollY < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrollY * 0.4}px)`;
        heroImage.style.transform = `translateY(${scrollY * 0.2}px)`;
    }
    
    // Apply subtle parallax to section headings
    document.querySelectorAll('section h2').forEach((heading, index) => {
        const sectionTop = heading.closest('section').offsetTop;
        const distance = scrollY - sectionTop;
        
        if (Math.abs(distance) < window.innerHeight) {
            heading.style.transform = `translateY(${distance * 0.05}px)`;
        }
    });
}

// Setup Orbit Animations
function setupOrbits() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;
    
    // Create orbit container
    const orbitContainer = document.createElement('div');
    orbitContainer.className = 'orbit-container';
    
    // Create orbit 1
    const orbit1 = document.createElement('div');
    orbit1.className = 'orbit orbit-1';
    
    // Create orbit 2
    const orbit2 = document.createElement('div');
    orbit2.className = 'orbit orbit-2';
    
    // Add orbits to container
    orbitContainer.appendChild(orbit1);
    orbitContainer.appendChild(orbit2);
    
    // Add orbit container to hero section
    heroSection.appendChild(orbitContainer);
    
    // Add dots to orbit 1
    for (let i = 0; i < 5; i++) {
        const dot = document.createElement('div');
        dot.className = 'orbit-dot';
        const angle = (i / 5) * Math.PI * 2; // Distribute evenly
        const radius = orbit1.offsetWidth / 2;
        
        // Position with trigonometry
        dot.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        dot.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
        
        // Add animation
        dot.style.animation = `orbitRotation1 ${15 + i * 2}s linear infinite`;
        
        orbit1.appendChild(dot);
    }
    
    // Add dots to orbit 2
    for (let i = 0; i < 7; i++) {
        const dot = document.createElement('div');
        dot.className = 'orbit-dot';
        const angle = (i / 7) * Math.PI * 2; // Distribute evenly
        const radius = orbit2.offsetWidth / 2;
        
        // Position with trigonometry
        dot.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        dot.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
        
        // Add animation
        dot.style.animation = `orbitRotation2 ${20 + i * 3}s linear infinite`;
        
        orbit2.appendChild(dot);
    }
    
    // Add orbit animation keyframes
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes orbitRotation1 {
            0% {
                transform: rotate(0deg) translateX(${orbit1.offsetWidth / 2}px) rotate(0deg);
            }
            100% {
                transform: rotate(360deg) translateX(${orbit1.offsetWidth / 2}px) rotate(-360deg);
            }
        }
        
        @keyframes orbitRotation2 {
            0% {
                transform: rotate(0deg) translateX(${orbit2.offsetWidth / 2}px) rotate(0deg);
            }
            100% {
                transform: rotate(-360deg) translateX(${orbit2.offsetWidth / 2}px) rotate(360deg);
            }
        }
    `;
    
    document.head.appendChild(styleSheet);
}

// Setup Particle Effects
function setupParticles() {
    document.addEventListener('mousemove', function(e) {
        if (Math.random() < 0.1) { // Only create particles occasionally for performance
            createParticle(e.clientX, e.clientY);
        }
    });
}

// Create a particle at the specified position
function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Randomize particle color
    const hue = Math.floor(Math.random() * 60) + 240; // Blue to purple range
    particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
    particle.style.boxShadow = `0 0 10px hsl(${hue}, 100%, 70%)`;
    
    // Randomize particle size
    const size = Math.random() * 3 + 1;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Add to body
    document.body.appendChild(particle);
    
    // Animate particle
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const distance = Math.random() * 100 + 50;
    const duration = Math.random() * 1500 + 1000;
    
    // Start animation
    const startTime = Date.now();
    
    function animateParticle() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            particle.remove();
            return;
        }
        
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentDistance = distance * easeProgress;
        const currentX = x + Math.cos(angle) * currentDistance;
        const currentY = y + Math.sin(angle) * currentDistance;
        
        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;
        particle.style.opacity = 1 - easeProgress;
        
        requestAnimationFrame(animateParticle);
    }
    
    requestAnimationFrame(animateParticle);
}

// Create celebration particles when form is submitted
function createCelebrationParticles() {
    const waitlistForm = document.querySelector('.waitlist-form');
    if (!waitlistForm) return;
    
    const rect = waitlistForm.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create multiple particles in a celebration pattern
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50 + 20;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            createParticle(x, y);
        }, i * 50);
    }
}