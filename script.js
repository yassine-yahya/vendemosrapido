// ============ Mobile nav toggle ============
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu after clicking a link (mobile)
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============ FAQ accordion ============
document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // Close all other items
    document.querySelectorAll('.faq-item').forEach((other) => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-answer').style.maxHeight = null;
      }
    });

    if (isOpen) {
      item.classList.remove('open');
      question.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = null;
    } else {
      item.classList.add('open');
      question.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ============ Success modal ============
const successModal = document.getElementById('successModal');

function openModal() {
  if (!successModal) return;
  successModal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!successModal) return;
  successModal.classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('successModalClose')?.addEventListener('click', closeModal);
document.getElementById('successModalOk')?.addEventListener('click', closeModal);
successModal?.addEventListener('click', (e) => {
  if (e.target === successModal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ============ Form validation + AJAX submit with modal ============
document.querySelectorAll('.lead-form').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#ef4444';
      } else {
        field.style.borderColor = '';
      }
    });
    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    const ajaxUrl = form.action.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');

    fetch(ajaxUrl, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('FormSubmit error');
        return res.json();
      })
      .then(() => {
        form.reset();
        openModal();
      })
      .catch(() => {
        // Fallback: normal form submission (will redirect to gracias.html via _next,
        // or show FormSubmit's own confirmation the very first time before activation)
        form.submit();
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
  });
});

// ============ Scroll reveal animations ============
const revealTargets = document.querySelectorAll('.card, .testimonial');

if (revealTargets.length) {
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 4) * 80}ms`;
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    // No IntersectionObserver support or user prefers reduced motion: show immediately
    revealTargets.forEach((el) => el.classList.add('reveal-visible'));
  }
}

// ============ Footer year ============
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
