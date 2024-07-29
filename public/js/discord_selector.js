document.getElementById('add-to-app').addEventListener('click', function() {
  window.open('/auth/discord/app', '_blank');
});

document.getElementById('add-to-server').addEventListener('click', function() {
  window.open('/auth/discord/server', '_blank');
});

// GSAP Animations
gsap.from(".bot-header", {duration: 1, y: -50, opacity: 0, ease: "bounce"});
gsap.from(".option", {duration: 1, opacity: 0, y: 30, stagger: 0.2, ease: "power1.inOut"});

// SortableJS Initialization
let optionsContainer = document.querySelector('.options');
Sortable.create(optionsContainer, {
  animation: 150,
  ghostClass: 'sortable-ghost'
});
