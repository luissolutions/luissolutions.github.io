
document.body.addEventListener('change', function (e) {
  if (e.target.closest('.theme-content')) {
    const theme = e.target.value;
    const link = document.querySelector('link[rel="stylesheet"]');
    link.href = theme;
    localStorage.setItem('theme', theme);
  }
});
