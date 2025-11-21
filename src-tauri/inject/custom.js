document.addEventListener('DOMContentLoaded', () => {
  // 1. Poproś o uprawnienia do powiadomień od razu po starcie (wymagane w WebView)
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  let lastTitle = document.title;
  const targetNode = document.querySelector('title');

  // 2. Logika obserwatora (MutationObserver)
  if (targetNode) {
    const observer = new MutationObserver((mutations) => {
      const currentTitle = document.title;

      // Ignorujemy te same tytuły lub domyślny "Messenger"
      if (currentTitle === lastTitle || currentTitle === 'Messenger') return;

      // Wykrywamy wzorzec (X) na początku tytułu
      if (/^\(\d+\)/.test(currentTitle)) {
        
        // 3. Wywołanie standardowego API, które Tauri zamieni na Windows Toast
        const cleanText = currentTitle.replace(/^\(\d+\)\s*/, '');
        const notif = new Notification("Nowa wiadomość", {
          body: cleanText,
          silent: false, // Dźwięk systemowy Windows
          icon: 'https://static.xx.fbcdn.net/rsrc.php/yv/r/B8nx2qW2beo.ico'
        });

        notif.onclick = () => {
          window.focus(); // Próba przywrócenia okna Pake
        };
      }
      lastTitle = currentTitle;
    });

    observer.observe(targetNode, { characterData: true, childList: true, subtree: true });
    console.log('[Pake Injection] Messenger Title Watcher active.');
  }
});
