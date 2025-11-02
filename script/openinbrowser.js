function openInBrowser() {
    const url = window.location.href;

    if (/android/i.test(navigator.userAgent)) {
        // Force Chrome intent
        window.location.replace(
            "intent://" +
            url.replace(/^https?:\/\//, "") +
            "#Intent;scheme=https;package=com.android.chrome;end"
        );
    } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        // Open in Safari
        window.location.replace(url);
    }
}

function detectWebview() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return /(FBAN|FBAV|Instagram|Line|TikTok|Twitter)/i.test(ua);
}

// Run only once to avoid infinite reloads
if (detectWebview() && !sessionStorage.getItem("redirected")) {
    sessionStorage.setItem("redirected", "true");
    openInBrowser();
}