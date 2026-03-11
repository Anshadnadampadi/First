
  function goTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) { target.classList.add('active'); window.scrollTo(0,0); }
  }

  function togglePass() {
    const inp = document.getElementById('login-pass');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }

  function showResetStep2() {
    document.getElementById('reset-step1').style.display = 'none';
    document.getElementById('reset-step2').style.display = 'block';
  }

  function otpNext(el, idx) {
    const inputs = document.querySelectorAll('#page-otp .otp-inputs input');
    if (el.value && idx < 6) inputs[idx].focus();
  }

  function toggleAddProduct() {
    const f = document.getElementById('add-product-form');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // Report tab interactivity
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      this.closest('.report-tabs').querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // OTP timer countdown
  let seconds = 45;
  const timerEls = document.querySelectorAll('.otp-timer span');
  setInterval(() => {
    if (seconds > 0) {
      seconds--;
      timerEls.forEach(el => el.textContent = '00:' + String(seconds).padStart(2,'0'));
    } else {
      timerEls.forEach(el => el.textContent = 'Resend now');
    }
  }, 1000);

  // navbar
  document.addEventListener("DOMContentLoaded",function(){

const searchIcon = document.querySelector(".bi-search")

if(searchIcon){
searchIcon.addEventListener("click",()=>{
alert("Search clicked")
})
}

})