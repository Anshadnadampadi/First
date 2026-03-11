
  // PAGE ROUTING
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
      return;
    }

    // Fallback for single-page sections when dedicated page containers are absent.
    const sectionMap = {
      products: 'best-selling',
      'product-detail': 'best-selling',
      cart: 'newsletter',
      contact: 'newsletter',
      about: 'why-choose'
    };
    const sectionId = sectionMap[pageId];
    if (!sectionId) return;

    const sectionTarget = document.getElementById(sectionId);
    if (sectionTarget) {
      sectionTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // PROFILE SECTION SWITCHING
  function showProfileSection(section) {
    // Hide all sections
    document.querySelectorAll('[id^="profile-section-"]').forEach(el => el.style.display = 'none');
    // Show selected
    const target = document.getElementById('profile-section-' + section);
    if (target) target.style.display = 'block';
    // Update nav active state
    document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
  }

  // FILTER CHIPS
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // STORAGE OPTIONS
  document.querySelectorAll('.storage-opt').forEach(opt => {
    opt.addEventListener('click', function() {
      document.querySelectorAll('.storage-opt').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // COLOR OPTIONS
  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', function() {
      document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // DETAIL THUMBS
  document.querySelectorAll('.detail-thumb').forEach(thumb => {
    thumb.addEventListener('click', function() {
      document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const src = this.querySelector('img').src;
      document.querySelector('.detail-main-img img').src = src;
    });
  });

  // PAYMENT METHODS
  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', function() {
      document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
      this.classList.add('active');
      this.querySelector('input').checked = true;
    });
  });

  // COUNTDOWN TIMER
  let totalSeconds = 5 * 3600 + 23 * 60 + 12;
  function updateCountdown() {
    if (totalSeconds <= 0) return;
    totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const cdH = document.getElementById('cd-h');
    const cdM = document.getElementById('cd-m');
    const cdS = document.getElementById('cd-s');
    if (cdH) cdH.textContent = String(h).padStart(2, '0');
    if (cdM) cdM.textContent = String(m).padStart(2, '0');
    if (cdS) cdS.textContent = String(s).padStart(2, '0');
  }
  setInterval(updateCountdown, 1000);

  // OTP INPUT FOCUS
  document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
    input.addEventListener('input', function() {
      if (this.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });
