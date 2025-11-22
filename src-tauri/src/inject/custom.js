console.log('[Pake Injection] custom.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Pake Injection] DOMContentLoaded fired');

  const { invoke } = window.__TAURI__.core;

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

  const updateBadge = (count) => {
    console.log(`[Pake Injection] Updating badge to: ${count}`);
    invoke('update_badge', { count: count }).catch(err => {
      console.error('[Pake Injection] Failed to update badge:', err);
    });
  };

  // Clear badge on focus
  window.addEventListener('focus', () => {
    console.log('[Pake Injection] Window focused, clearing badge');
    updateBadge(0);
  });

  // Restore badge on blur (if there are unread messages)
  window.addEventListener('blur', () => {
    console.log(`[Pake Injection] Window blurred, restoring badge: ${currentUnreadCount}`);
    updateBadge(currentUnreadCount);
  });

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
        updateBadge(0);
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

        // Only update badge if window is not focused (or update it anyway and let focus handler clear it immediately? 
        // Better to update it so it's ready for blur, but if focused, we might want to keep it clear.
        // Actually, if user is in the window but looking at another chat, the title might update.
        // But usually "focus" means the window is active. 
        // Let's check document.hasFocus()
        if (!document.hasFocus()) {
          updateBadge(currentUnreadCount);
        }
      }

      lastTitle = currentTitle;
    });

    observer.observe(targetNode, { characterData: true, childList: true, subtree: true });
    console.log('[Pake Injection] Messenger Title Watcher active.');
  };

  initObserver();
});