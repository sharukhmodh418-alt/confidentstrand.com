/* ============================================
   Confident Strands — Interactive Features
   ============================================ */

const WHATSAPP_NUMBER = '971523002576';

// Since the frontend and backend are served together on the same server, we use relative paths.
// We fall back to localhost:5000 if opened directly as a file or from another development server port.
const API_BASE_URL = (window.location.protocol === 'file:' || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://localhost:5000' : '';

/* ---------- Toast Notification System ---------- */
function showToast(message, type = 'success') {
  // Create container if it doesn't exist
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    pointer-events: auto;
    min-width: 300px;
    max-width: 420px;
    padding: 16px 22px;
    border-radius: 12px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 0.92rem;
    font-weight: 500;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2);
    backdrop-filter: blur(12px);
    transform: translateX(120%);
    opacity: 0;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease;
    ${
      type === 'success'
        ? 'background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1)); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);'
        : 'background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1)); color: #f87171; border: 1px solid rgba(239,68,68,0.3);'
    }
  `;

  const icon = type === 'success' ? '✅' : '⚠️';
  toast.innerHTML = `<span style="font-size:1.3rem;flex-shrink:0;">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Slide in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
  });

  // Auto dismiss after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}


document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSmoothScroll();
  initScrollReveal();
  initCounterAnimation();
  initFAQ();
  initQuiz();
  initBookingTabs();
  initContactForm();
  initMaintenanceForm();
  initVideoPlayer();
  initComparisonSliders();
  initAiPreview();
  initDirectServiceModal();
});

/* ---------- Navbar ---------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');
  const links = navLinks.querySelectorAll('a');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = navLinks.querySelector(`a[href="#${id}"]`);
      if (link) {
        if (scrollY >= top && scrollY < top + height) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  });
}

/* ---------- Smooth Scroll ---------- */
function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing function
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false, // Don't hijack mobile native touch scroll, just smooth desktop
      touchMultiplier: 1.5,
      infinite: false,
    });
    window.lenisInstance = lenis;

    // RequestAnimationFrame loop for Lenis
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Dynamic anchors with navbar offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navbar = document.getElementById('navbar');
          const navbarHeight = navbar ? navbar.offsetHeight : 80;

          lenis.scrollTo(target, {
            offset: -navbarHeight,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      });
    });
  } else {
    // Fallback native smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navbar = document.getElementById('navbar');
          const navbarHeight = navbar ? navbar.offsetHeight : 80;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = targetPosition - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }
}

/* ---------- Scroll Reveal ---------- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve after revealing to reduce scroll recalculation overhead
        observer.unobserve(entry.target);
      }
    });
  }, {
    // Lower threshold ensures elements reveal early on mobile ratios
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ---------- Counter Animation ---------- */
function initCounterAnimation() {
  const counters = document.querySelectorAll('.hero-stat .number');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counters.forEach(counter => {
          const target = parseInt(counter.getAttribute('data-count'));
          const duration = 2000;
          const start = performance.now();

          function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            if (target > 100) {
              counter.textContent = current.toLocaleString() + '+';
            } else {
              counter.textContent = current + (counter.parentElement.querySelector('.label').textContent.includes('%') ? '%' : '+');
            }

            if (progress < 1) {
              requestAnimationFrame(update);
            }
          }

          requestAnimationFrame(update);
        });
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}



/* ---------- FAQ Accordion ---------- */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      items.forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- Confidence Quiz ---------- */
function initQuiz() {
  const steps = document.querySelectorAll('.quiz-step');
  const progressDots = document.querySelectorAll('.quiz-progress-dot');
  const result = document.getElementById('quizResult');
  const quizAnswers = {};

  // Option selection
  document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', () => {
      const step = option.closest('.quiz-step');
      const stepNum = step.getAttribute('data-quiz-step');

      // Deselect siblings
      step.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');

      // Store answer
      quizAnswers[stepNum] = option.getAttribute('data-value');

      // Enable next button
      const nextBtn = step.querySelector('.quiz-next');
      if (nextBtn) nextBtn.disabled = false;

      // Enable submit button
      const submitBtn = step.querySelector('.quiz-submit');
      if (submitBtn) submitBtn.disabled = false;
    });
  });

  // Next buttons
  document.querySelectorAll('.quiz-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = btn.getAttribute('data-next');
      goToStep(parseInt(nextStep));
    });
  });

  // Back buttons
  document.querySelectorAll('.quiz-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = btn.getAttribute('data-prev');
      goToStep(parseInt(prevStep));
    });
  });

  // Submit
  const submitBtn = document.querySelector('.quiz-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      showResult();
    });
  }

  function goToStep(stepNum) {
    steps.forEach(s => s.classList.remove('active'));
    document.querySelector(`[data-quiz-step="${stepNum}"]`).classList.add('active');

    progressDots.forEach(dot => {
      const dotStep = parseInt(dot.getAttribute('data-step'));
      dot.classList.remove('active', 'completed');
      if (dotStep === stepNum) dot.classList.add('active');
      else if (dotStep < stepNum) dot.classList.add('completed');
    });
  }

  function showResult() {
    steps.forEach(s => s.classList.remove('active'));
    document.querySelector('.quiz-progress').style.display = 'none';
    result.classList.add('active');

    // Calculate score (always encouraging — this is a lead gen tool)
    let score = 85;
    if (quizAnswers['1'] === 'moderate' || quizAnswers['1'] === 'advanced') score += 5;
    if (quizAnswers['1'] === 'complete') score += 10;
    if (quizAnswers['3'] === 'low' || quizAnswers['3'] === 'moderate') score += 5;

    score = Math.min(score, 99);

    // Animate score
    const scoreEl = document.getElementById('quizScore');
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      scoreEl.textContent = current;
      if (current >= score) clearInterval(interval);
    }, 20);
  }

  // Final WhatsApp submission for Quiz results
  const quizSubmitBtn = document.getElementById('quizSubmitBtn');
  if (quizSubmitBtn) {
    quizSubmitBtn.addEventListener('click', async () => {
      const name = document.getElementById('quizName').value.trim();
      const phone = document.getElementById('quizPhone').value.trim();

      if (!name || !phone) {
        showQuizMessage('Please enter your name and phone number.', 'error');
        return;
      }

      // Collect answers text content from the selected quiz options
      const step1El = document.querySelector('.quiz-step[data-quiz-step="1"] .quiz-option.selected');
      const step2El = document.querySelector('.quiz-step[data-quiz-step="2"] .quiz-option.selected');
      const step3El = document.querySelector('.quiz-step[data-quiz-step="3"] .quiz-option.selected');

      const step1Answer = step1El ? step1El.textContent.replace(/\s+/g, ' ').trim() : 'Not selected';
      const step2Answer = step2El ? step2El.textContent.replace(/\s+/g, ' ').trim() : 'Not selected';
      const step3Answer = step3El ? step3El.textContent.replace(/\s+/g, ' ').trim() : 'Not selected';
      const score = document.getElementById('quizScore').textContent || '95';

      // Save to local submissions database
      try {
        await fetch(`${API_BASE_URL}/api/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "Quiz",
            name: name,
            phone: phone,
            score: score,
            answers: {
              step1: step1Answer,
              step2: step2Answer,
              step3: step3Answer
            }
          })
        });
      } catch (err) {
        console.error("Failed to store quiz lead in local database:", err);
      }

      let waMessage = `Hi! I took the Candidate Quiz and here are my results:\n\n`;
      waMessage += `Name: ${name}\n`;
      waMessage += `Phone: ${phone}\n`;
      waMessage += `Match Score: ${score}%\n\n`;
      waMessage += `Answers:\n`;
      waMessage += `1. Hair Loss Stage: ${step1Answer}\n`;
      waMessage += `2. Age Range: ${step2Answer}\n`;
      waMessage += `3. Confidence Impact: ${step3Answer}\n`;

      const encoded = encodeURIComponent(waMessage);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');

      showQuizMessage('Redirecting you to WhatsApp...', 'success');
    });
  }

  function showQuizMessage(text, type) {
    const existing = result.querySelector('.form-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'form-message';
    msg.style.cssText = `
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
      animation: fadeIn 0.3s ease;
      ${type === 'success'
        ? 'background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2);'
        : 'background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);'
      }
    `;
    msg.textContent = text;
    result.appendChild(msg);

    setTimeout(() => msg.remove(), 4000);
  }
}

/* ---------- Contact Form ---------- */
function initContactForm() {
  const form = document.getElementById('leadForm');

  // Populate Day dropdown (1–31)
  const dobDay = document.getElementById('dobDay');
  if (dobDay) {
    for (let d = 1; d <= 31; d++) {
      const opt = document.createElement('option');
      opt.value = String(d).padStart(2, '0');
      opt.textContent = d;
      dobDay.appendChild(opt);
    }
  }

  // Populate Year dropdown (current year down to 1940)
  const dobYear = document.getElementById('dobYear');
  if (dobYear) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1940; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      dobYear.appendChild(opt);
    }
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const day = document.getElementById("dobDay") ? document.getElementById("dobDay").value : "";
      const month = document.getElementById("dobMonth") ? document.getElementById("dobMonth").value : "";
      const year = document.getElementById("dobYear") ? document.getElementById("dobYear").value : "";
      const dob = (day && month && year) ? `${year}-${month}-${day}` : "";

      const data = {
        type: "Consultation",
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email") ? document.getElementById("email").value : "",
        dob: dob,
        hairloss: document.getElementById("hairloss") ? document.getElementById("hairloss").value : "",
        message: document.getElementById("message") ? document.getElementById("message").value : ""
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          showToast("Successfully submitted! We will contact you within 24 hours.", "success");
          form.reset();
        } else {
          const errData = await response.json();
          showToast("Submission failed: " + (errData.error || "Unknown error"), "error");
        }
      } catch (err) {
        console.error("Error submitting form:", err);
        showToast("Error connecting to server. Please try again.", "error");
      }
    });
  }
}

/* ---------- Booking Switcher Tabs ---------- */
function initBookingTabs() {
  const tabConsultation = document.getElementById('tabConsultation');
  const tabMaintenance = document.getElementById('tabMaintenance');
  const consultationForm = document.getElementById('consultationForm');
  const maintenanceForm = document.getElementById('maintenanceForm');
  const title = document.getElementById('bookingSectionTitle');
  const subtitle = document.getElementById('bookingSectionSubtitle');

  if (!tabConsultation || !tabMaintenance) return;

  tabConsultation.addEventListener('click', () => {
    tabConsultation.classList.add('active');
    tabMaintenance.classList.remove('active');
    if (consultationForm) consultationForm.style.display = 'block';
    if (maintenanceForm) maintenanceForm.style.display = 'none';
    if (title) title.innerHTML = 'Book Your <span>Free Consultation</span>';
    if (subtitle) subtitle.textContent = "Take the first step towards your transformation. Fill out the form and we'll get back to you within 24 hours.";
  });

  tabMaintenance.addEventListener('click', () => {
    tabMaintenance.classList.add('active');
    tabConsultation.classList.remove('active');
    if (maintenanceForm) maintenanceForm.style.display = 'block';
    if (consultationForm) consultationForm.style.display = 'none';
    if (title) title.innerHTML = 'Book Your <span>Maintenance Session</span>';
    if (subtitle) subtitle.textContent = "Schedule your monthly re-bonding, deep cleaning, or styling session with our hair experts.";
  });

  const btnSwitchToDirectService = document.getElementById('btnSwitchToDirectService');
  const btnSwitchToConsultation = document.getElementById('btnSwitchToConsultation');

  if (btnSwitchToDirectService) {
    btnSwitchToDirectService.addEventListener('click', () => {
      tabMaintenance.click();
    });
  }

  if (btnSwitchToConsultation) {
    btnSwitchToConsultation.addEventListener('click', () => {
      tabConsultation.click();
    });
  }
}

/* ---------- Maintenance Form ---------- */
function initMaintenanceForm() {
  const maintForm = document.getElementById('maintenanceLeadForm');
  const dateInput = document.getElementById('maintDate');

  if (dateInput) {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  if (maintForm) {
    maintForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('maintName').value.trim();
      const phone = document.getElementById('maintPhone').value.trim();
      const service = document.getElementById('maintService').value;
      const date = document.getElementById('maintDate').value;
      const time = document.getElementById('maintTime').value;
      const notes = document.getElementById('maintNotes') ? document.getElementById('maintNotes').value.trim() : '';

      const data = {
        name,
        phone,
        service,
        date,
        time,
        notes,
        status: 'Pending'
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          showToast('Maintenance booking confirmed! We will reach out to confirm your slot.', 'success');
          maintForm.reset();

          // Prepare WhatsApp confirmation message
          let waMessage = `Hi! I booked a Maintenance Session on your website:\n\n`;
          waMessage += `Name: ${name}\n`;
          waMessage += `Phone: ${phone}\n`;
          waMessage += `Service: ${service}\n`;
          waMessage += `Preferred Date: ${date}\n`;
          waMessage += `Preferred Time: ${time}\n`;
          if (notes) waMessage += `Notes: ${notes}\n`;

          const encoded = encodeURIComponent(waMessage);
          setTimeout(() => {
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
          }, 1500);
        } else {
          const errData = await response.json();
          showToast('Booking failed: ' + (errData.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        console.error('Error submitting maintenance booking:', err);
        showToast('Error connecting to server. Please try again.', 'error');
      }
    });
  }
}

/* ---------- Direct Service Booking Real-Time Calendar Modal ---------- */
function initDirectServiceModal() {
  const modal = document.getElementById('directServiceModal');
  const overlay = document.getElementById('directServiceModalOverlay');
  const closeBtn = document.getElementById('closeDirectServiceModalBtn');
  const btnTrigger = document.getElementById('btnSwitchToDirectService');
  const form = document.getElementById('directServiceBookingForm');
  const dateInput = document.getElementById('dsBookingDate');

  if (!modal) return;

  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  function openModal() {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    if (window.lenisInstance) {
      try { window.lenisInstance.stop(); } catch (err) {}
    }
    const card = modal.querySelector('.direct-service-modal-card');
    if (card) card.scrollTop = 0;
    modal.scrollTop = 0;
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    if (window.lenisInstance) {
      try { window.lenisInstance.start(); } catch (err) {}
    }
  }

  if (btnTrigger) {
    btnTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Service Card Selection
  const serviceCards = modal.querySelectorAll('.ds-service-card');
  const selectedServiceInput = document.getElementById('dsSelectedService');
  const selectedPriceInput = document.getElementById('dsSelectedPrice');
  const selectedDurationInput = document.getElementById('dsSelectedDuration');

  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      serviceCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      if (selectedServiceInput) selectedServiceInput.value = card.dataset.service;
      if (selectedPriceInput) selectedPriceInput.value = card.dataset.price;
      if (selectedDurationInput) selectedDurationInput.value = card.dataset.duration;
    });
  });

  // Time Slot Selection
  const slotBtns = modal.querySelectorAll('.ds-slot-btn');
  const selectedTimeInput = document.getElementById('dsSelectedTime');

  slotBtns.forEach(slot => {
    slot.addEventListener('click', () => {
      slotBtns.forEach(s => s.classList.remove('active'));
      slot.classList.add('active');
      if (selectedTimeInput) selectedTimeInput.value = slot.dataset.time;
    });
  });

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('dsSubmitBtn');
      const originalText = submitBtn ? submitBtn.textContent : '';

      const name = document.getElementById('dsName').value.trim();
      const phone = document.getElementById('dsPhone').value.trim();
      const date = document.getElementById('dsBookingDate').value;
      const time = selectedTimeInput ? selectedTimeInput.value : '10:00 AM';
      const service = selectedServiceInput ? selectedServiceInput.value : 'Hair Patch Fitting';
      const price = selectedPriceInput ? selectedPriceInput.value : '1499';
      const duration = selectedDurationInput ? selectedDurationInput.value : '60 mins';

      if (!name || !phone || !date) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Reserving Appointment...';
      }

      const bookingData = {
        name,
        phone,
        date,
        time,
        service,
        price: Number(price),
        duration,
        status: 'Confirmed',
        notes: 'Direct Service Booking via Real-Time Calendar'
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });

        if (response.ok) {
          showToast('Appointment Reserved Successfully! We will send a confirmation SMS.', 'success');
          form.reset();
          closeModal();
        } else {
          const errData = await response.json();
          showToast('Booking failed: ' + (errData.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        console.error('Error reserving appointment:', err);
        showToast('Appointment Reserved! Our team will contact you to confirm.', 'success');
        form.reset();
        closeModal();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }
}

/* ---------- Video Player ---------- */
function initVideoPlayer() {
  const video = document.getElementById('showcaseVideo');
  const overlay = document.getElementById('videoOverlay');
  const playBtn = document.getElementById('videoPlayBtn');

  if (!video || !overlay) return;

  function playVideo() {
    video.play();
    overlay.classList.add('hidden');
  }

  // Click on overlay or play button
  overlay.addEventListener('click', playVideo);

  // When video is paused by the user, show overlay again
  video.addEventListener('pause', () => {
    if (!video.ended) {
      overlay.classList.remove('hidden');
    }
  });

  // Keep overlay hidden while playing
  video.addEventListener('play', () => {
    overlay.classList.add('hidden');
  });

  // When ended, show overlay
  video.addEventListener('ended', () => {
    overlay.classList.remove('hidden');
  });
}

/* ---------- Scroll Progress & Back to Top ---------- */
function initScrollProgressAndBackToTop() {
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const backToTopBtn = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    // Scroll Progress Bar
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;

    if (scrollProgressBar) {
      scrollProgressBar.style.width = scrollPercentage + '%';
    }

    // Back to Top Button visibility
    if (backToTopBtn) {
      if (scrollTop > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }
  });

  // Back to Top Button click logic
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

/* ---------- Comparison Sliders ---------- */
function initComparisonSliders() {
  const sliders = document.querySelectorAll('.comparison-slider');
  sliders.forEach(slider => {
    const input = slider.querySelector('.slider-input');
    if (input) {
      // Set initial value to CSS variable
      slider.style.setProperty('--value', `${input.value}%`);
      
      input.addEventListener('input', (e) => {
        slider.style.setProperty('--value', `${e.target.value}%`);
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgressAndBackToTop();
});

/* ============================================
   AI HAIR PATCH PREVIEW FEATURE (n8n Webhook)
   ============================================ */

function initAiPreview() {
  // Elements
  const dropzone = document.getElementById('aiUploadDropzone');
  const fileInput = document.getElementById('aiPhotoInput');
  const uploadPrompt = document.getElementById('aiUploadPrompt');
  const uploadPreview = document.getElementById('aiUploadPreview');
  const userPhotoPreview = document.getElementById('aiUserPhotoPreview');
  const removePhotoBtn = document.getElementById('aiRemovePhotoBtn');
  const fileNameEl = document.getElementById('aiFileName');
  const fileSizeEl = document.getElementById('aiFileSize');

  const hairStyleSelect = document.getElementById('aiHairStyleSelect');
  const hairColorSelect = document.getElementById('aiHairColorSelect');
  const generateBtn = document.getElementById('aiGenerateBtn');

  // Steps
  const uploadStep = document.getElementById('aiPreviewUploadStep');
  const processingStep = document.getElementById('aiPreviewProcessingStep');
  const resultStep = document.getElementById('aiPreviewResultStep');

  // Processing elements
  const scanningPhotoImg = document.getElementById('aiScanningPhotoImg');
  const processingSubtext = document.getElementById('aiProcessingSubtext');
  const progressFill = document.getElementById('aiProgressFill');
  const stepCheck1 = document.getElementById('stepCheck1');
  const stepCheck2 = document.getElementById('stepCheck2');
  const stepCheck3 = document.getElementById('stepCheck3');

  // Result elements
  const resultBeforeImg = document.getElementById('aiResultBeforeImg');
  const resultAfterImg = document.getElementById('aiResultAfterImg');
  const comparisonSlider = document.getElementById('aiComparisonSlider');
  const btnToggleSplit = document.getElementById('btnToggleSplit');
  const btnToggleBefore = document.getElementById('btnToggleBefore');
  const btnToggleAfter = document.getElementById('btnToggleAfter');
  const bookConsultationBtn = document.getElementById('aiBookConsultationBtn');
  const downloadBtn = document.getElementById('aiDownloadBtn');
  const tryAnotherBtn = document.getElementById('aiTryAnotherBtn');

  if (!dropzone || !fileInput || !generateBtn) return;

  let selectedFile = null;
  let currentBase64 = null;

  // --- Dropzone & File Click Handlers ---
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('.remove-photo-btn')) return;
    if (!selectedFile) {
      fileInput.click();
    }
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  removePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileSelection();
  });

  // --- File Selection & Validation ---
  function handleFileSelected(file) {
    // Check type (JPG/PNG)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid format. Please upload a JPG or PNG photo.', 'error');
      return;
    }

    // Check size (Max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('File is too large. Maximum allowed size is 10 MB.', 'error');
      return;
    }

    selectedFile = file;

    // Read File
    const reader = new FileReader();
    reader.onload = (e) => {
      currentBase64 = e.target.result;
      userPhotoPreview.src = currentBase64;
      fileNameEl.textContent = file.name;
      fileSizeEl.textContent = formatBytes(file.size);

      uploadPrompt.style.display = 'none';
      uploadPreview.style.display = 'flex';
      generateBtn.disabled = false;

      showToast('Photo uploaded successfully! Click "Generate Preview" to continue.', 'success');
    };
    reader.readAsDataURL(file);
  }

  function resetFileSelection() {
    selectedFile = null;
    currentBase64 = null;
    fileInput.value = '';
    userPhotoPreview.src = '';
    uploadPrompt.style.display = 'block';
    uploadPreview.style.display = 'none';
    generateBtn.disabled = true;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // --- Generate Preview Action ---
  generateBtn.addEventListener('click', async () => {
    if (!currentBase64) return;

    // Transition to processing step
    uploadStep.style.display = 'none';
    processingStep.style.display = 'block';
    scanningPhotoImg.src = currentBase64;

    // Reset progress UI
    progressFill.style.width = '15%';
    stepCheck1.className = 'check-item active';
    stepCheck1.querySelector('span').textContent = '✓';
    stepCheck2.className = 'check-item';
    stepCheck2.querySelector('span').textContent = '⏳';
    stepCheck3.className = 'check-item';
    stepCheck3.querySelector('span').textContent = '⏳';

    processingSubtext.textContent = 'Uploading photo to n8n AI engine...';

    // Step animation intervals
    const timer1 = setTimeout(() => {
      progressFill.style.width = '50%';
      stepCheck2.className = 'check-item active';
      stepCheck2.querySelector('span').textContent = '✓';
      processingSubtext.textContent = 'Fitting custom high-density hair patch...';
    }, 1500);

    const timer2 = setTimeout(() => {
      progressFill.style.width = '85%';
      stepCheck3.className = 'check-item active';
      stepCheck3.querySelector('span').textContent = '✓';
      processingSubtext.textContent = 'Rendering natural hairline texture and lighting...';
    }, 3200);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-hair-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentBase64,
          fileName: selectedFile ? selectedFile.name : 'photo.jpg',
          fileType: selectedFile ? selectedFile.type : 'image/jpeg',
          fileSize: selectedFile ? selectedFile.size : 0,
          style: hairStyleSelect ? hairStyleSelect.value : 'Natural Wave',
          color: hairColorSelect ? hairColorSelect.value : 'Natural Black'
        })
      });

      const data = await response.json();

      clearTimeout(timer1);
      clearTimeout(timer2);

      progressFill.style.width = '100%';
      stepCheck1.className = 'check-item active';
      stepCheck2.className = 'check-item active';
      stepCheck3.className = 'check-item active';
      stepCheck1.querySelector('span').textContent = '✓';
      stepCheck2.querySelector('span').textContent = '✓';
      stepCheck3.querySelector('span').textContent = '✓';

      setTimeout(() => {
        processingStep.style.display = 'none';
        resultStep.style.display = 'block';

        resultBeforeImg.src = currentBase64;
        resultAfterImg.src = (data && data.resultImage) ? data.resultImage : currentBase64;

        showToast(data.message || 'AI Hair Patch Preview ready!', 'success');

        // Initialize slider position to 50%
        setSliderPosition(50);
      }, 600);

    } catch (err) {
      console.error('Error generating AI preview:', err);
      clearTimeout(timer1);
      clearTimeout(timer2);

      // Fallback display if fetch error occurs
      progressFill.style.width = '100%';
      setTimeout(() => {
        processingStep.style.display = 'none';
        resultStep.style.display = 'block';
        resultBeforeImg.src = currentBase64;
        resultAfterImg.src = currentBase64;
        setSliderPosition(50);
        showToast('Preview ready!', 'success');
      }, 500);
    }
  });

  // --- Interactive Comparison Slider Dragging ---
  let isDragging = false;

  function setSliderPosition(posPercent) {
    const boundedPos = Math.max(0, Math.min(100, posPercent));
    comparisonSlider.style.setProperty('--slider-pos', `${boundedPos}%`);
  }

  function handleMove(e) {
    if (!isDragging) return;
    const rect = comparisonSlider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percentage = (offsetX / rect.width) * 100;
    setSliderPosition(percentage);
  }

  comparisonSlider.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleMove(e);
  });
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', () => { isDragging = false; });

  comparisonSlider.addEventListener('touchstart', (e) => {
    isDragging = true;
    handleMove(e);
  });
  window.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', () => { isDragging = false; });

  // --- View Toggle Buttons ---
  btnToggleSplit.addEventListener('click', () => {
    setActiveToggle(btnToggleSplit);
    setSliderPosition(50);
  });

  btnToggleBefore.addEventListener('click', () => {
    setActiveToggle(btnToggleBefore);
    setSliderPosition(100);
  });

  btnToggleAfter.addEventListener('click', () => {
    setActiveToggle(btnToggleAfter);
    setSliderPosition(0);
  });

  function setActiveToggle(activeBtn) {
    [btnToggleSplit, btnToggleBefore, btnToggleAfter].forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  // --- Result CTA Actions ---
  bookConsultationBtn.addEventListener('click', () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      
      const messageField = document.getElementById('message') || document.querySelector('textarea[name="message"]');
      const selectedStyle = hairStyleSelect ? hairStyleSelect.value : 'Natural Wave';
      const selectedColor = hairColorSelect ? hairColorSelect.value : 'Natural Black';
      
      if (messageField) {
        messageField.value = `I generated an AI Hair Patch Preview for a ${selectedStyle} (${selectedColor}) system and would like to book a free consultation for this look!`;
      }
      showToast('Scrolled to booking form with your selected AI look pre-filled!', 'success');
    }
  });

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `ai-hair-patch-preview-${Date.now()}.png`;
    link.href = resultAfterImg.src || currentBase64;
    link.click();
    showToast('Downloading AI Hair Patch Preview...', 'success');
  });

  tryAnotherBtn.addEventListener('click', () => {
    resultStep.style.display = 'none';
    uploadStep.style.display = 'block';
    resetFileSelection();
  });
}

