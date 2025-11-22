console.log('[Pake Injection] custom.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Pake Injection] DOMContentLoaded fired');
  
  // 1. Request permissions immediately
  if (Notification.permission !== "granted") {
    console.log('[Pake Injection] Requesting notification permission...');
    Notification.requestPermission().then(permission => {
      console.log('[Pake Injection] Permission result:', permission);
    });
  } else {
    console.log('[Pake Injection] Notification permission already granted');
  }

  let lastTitle = document.title;
  
  const initObserver = () => {
    const targetNode = document.querySelector('title');
    if (!targetNode) {
        console.log('[Pake Injection] <title> element not found, retrying in 1s...');
        setTimeout(initObserver, 1000);
        return;
    }

    console.log('[Pake Injection] <title> element found, starting observer');

    // 2. Observer logic
    const observer = new MutationObserver((mutations) => {
      const currentTitle = document.title;
      console.log('[Pake Injection] Title changed to:', currentTitle);

      // Ignore same titles or default "Messenger"
      if (currentTitle === lastTitle || currentTitle === 'Messenger') return;

      // Detect pattern (X) at start of title
      if (/^\(\d+\)/.test(currentTitle)) {
        console.log('[Pake Injection] New message detected!');
        
        // 3. Trigger notification
        const cleanText = currentTitle.replace(/^\(\d+\)\s*/, '');
        const notif = new Notification("Nowa wiadomość", {
          body: cleanText,
          silent: false,
          icon: 'https://static.xx.fbcdn.net/rsrc.php/yv/r/B8nx2qW2beo.ico'
        });

        notif.onclick = () => {
          window.focus();
        };
      }
      lastTitle = currentTitle;
    });

    observer.observe(targetNode, { characterData: true, childList: true, subtree: true });
    console.log('[Pake Injection] Messenger Title Watcher active.');
  };

  initObserver();
});
