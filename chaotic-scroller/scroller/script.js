// Chaotic Reverse Scroller for Gamer Website

let lastScrollTop = 0;
let chaosMode = true;

window.addEventListener(
  "scroll",
  function (e) {
    if (!chaosMode) return;

    e.preventDefault();

    let currentScroll = window.scrollY;
    let scrollDiff = currentScroll - lastScrollTop;

    // Delay every scroll movement by 300ms
    setTimeout(() => {
      // 25% chance to reverse scroll
      if (Math.random() < 0.25) {
        window.scrollTo(0, currentScroll - scrollDiff * 2);
      }
      // 15% chance to auto scroll somewhere random
      else if (Math.random() < 0.15) {
        window.scrollTo({
          top: Math.floor(Math.random() * document.body.scrollHeight),
          behavior: "smooth",
        });
      }
    }, 300);

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  },
  { passive: false }
);

// Annoying gamer popups every 5 seconds
setInterval(() => {
  if (Math.random() < 0.4) {
    let phrases = [
      "🔥 DOUBLE KILL! BUY ENERGY DRINK NOW! 🔥",
      "⚡ LAG DETECTED – Upgrade Your Router! ⚡",
      "💀 GAME OVER! Insert Coin to Continue 💀",
      "🎯 Headshot Sale – 50% off Skins! 🎯",
      "🏆 PRO TIP: Alt+F4 for Ultra Boost! 🏆",
    ];
    alert(phrases[Math.floor(Math.random() * phrases.length)]);
  }
}, 5000);
