// Scroll to Top Button utility (vanilla JS)
// Call addScrollToTopButton() once in your app to enable the button

export function addScrollToTopButton() {
  if (document.getElementById('scrollToTopBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'scrollToTopBtn';
  btn.innerText = '↑';
  btn.title = 'Scroll to top';
  btn.setAttribute('aria-label', 'Scroll to top');
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    zIndex: 9999,
    padding: '14px 18px',
    background: '#222',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    fontSize: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    cursor: 'pointer',
    opacity: 0.85,
    transition: 'opacity 0.2s',
    display: 'none',
  });
  btn.onmouseover = () => (btn.style.opacity = 1);
  btn.onmouseout = () => (btn.style.opacity = 0.85);
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 200 ? 'block' : 'none';
  });
}
