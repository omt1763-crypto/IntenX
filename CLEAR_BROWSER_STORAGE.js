// Run this in browser console (F12) to clear ALL localStorage and sessionStorage

// Clear localStorage
localStorage.clear();

// Clear sessionStorage  
sessionStorage.clear();

// Clear cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c
    .replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ All browser storage cleared!');
console.log('Now refresh the page (Ctrl+Shift+R)');
