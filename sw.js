self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {});
self.addEventListener('fetch', function(event) {
  // Passive cache bypass for now (custom logic optional).
});