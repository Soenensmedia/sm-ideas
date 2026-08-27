export function showToast(message, isError = false) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:${isError ? '#3a1f14' : '#1d1a15'}; color:${isError ? '#e0a07a' : '#ede6d6'};
    border:1px solid ${isError ? '#5a3320' : '#2b2620'}; padding:10px 18px; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; z-index:300; opacity:0; transition:opacity .2s;
    max-width:90vw; text-align:center;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2500);
}
