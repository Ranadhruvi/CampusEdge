// Proctoring & Anti-Cheat System Utilities for CampusEdge

/**
 * Synthesizes an audible proctoring warning chime using Web Audio API.
 * Does not depend on external MP3 assets, guaranteeing immediate playback.
 */
export function playProctorAlertChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
    osc1.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.38);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(554.37, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1108.73, ctx.currentTime + 0.38);

    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn("Proctor chime synthesis error:", err);
  }
}

/**
 * Requests browser system notification permission if supported.
 */
export async function requestNotificationPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch (err) {
    console.warn("Notification permission request error:", err);
  }
}

/**
 * Fires an immediate OS / Browser notification if permitted.
 */
export function sendSystemProctorNotification(title, body) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title || "⚠️ Proctoring Alert", {
        body: body || "You navigated away from the exam tab. Return immediately!",
        icon: "/favicon.ico",
        requireInteraction: true,
        silent: false
      });
    }
  } catch (err) {
    console.warn("System notification dispatch error:", err);
  }
}

/**
 * Enters browser fullscreen mode safely.
 */
export async function enterFullscreenMode() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn("Fullscreen request error:", err.message);
  }
  return false;
}

/**
 * Exits browser fullscreen mode safely.
 */
export async function exitFullscreenMode() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
      return true;
    }
  } catch (err) {
    console.warn("Fullscreen exit error:", err.message);
  }
  return false;
}
