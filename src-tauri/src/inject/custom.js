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
  let currentUnreadCount = 0;

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

      // Ignore same titles
      if (currentTitle === lastTitle) return;

      console.log('[Pake Injection] Title changed to:', currentTitle);

      // Reset count if title is just "Messenger" (user read messages)
      if (currentTitle === 'Messenger') {
        console.log('[Pake Injection] Resetting unread count to 0');
        currentUnreadCount = 0;
        lastTitle = currentTitle;
        return;
      }

      // Check for unread count pattern: (X) ...
      const match = /^\((\d+)\)/.exec(currentTitle);
      if (match) {
        const newCount = parseInt(match[1], 10);

        if (newCount > currentUnreadCount) {
          console.log(`[Pake Injection] New message detected! Count increased: ${currentUnreadCount} -> ${newCount}`);

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
        } else {
          console.log(`[Pake Injection] Count not increased (${currentUnreadCount} -> ${newCount}), ignoring.`);
        }

        // Update count regardless (e.g. if count decreased, we still want to track it)
        currentUnreadCount = newCount;
      }

      lastTitle = currentTitle;
    });

    observer.observe(targetNode, { characterData: true, childList: true, subtree: true });
    console.log('[Pake Injection] Messenger Title Watcher active.');
  };

  initObserver();
});