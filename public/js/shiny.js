const shiny = document.querySelector('.shiny');

shiny.addEventListener('mouseenter', () => {
  gsap.to(".shiny", {
    backgroundPosition: "200% 0",
    repeat: -1,
    yoyo: true,
    ease: "linear",
    delay: 0.5
  });

  gsap.to(".shiny::before", {
    opacity: 1,
    repeat: -1,
    yoyo: true,
    ease: "power2.inOut"
  });
});

shiny.addEventListener('mouseleave', () => {
  gsap.killTweensOf(".shiny");
  gsap.killTweensOf(".shiny::before");
  gsap.to(".shiny", { backgroundPosition: "0 0" });
  gsap.to(".shiny::before", { opacity: 0 });
});

shiny.addEventListener('mousemove', (event) => {
  const rect = shiny.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  createStars(x, y);
});

function createStars(mouseX, mouseY) {
  for (let i = 0; i < 5; i++) { // 한 번에 별 5개 생성
    let star = document.createElement('div');
    star.classList.add('star');
    shiny.appendChild(star);

    let angle = Math.random() * 2 * Math.PI; // 랜덤 각도
    let distance = Math.random() * 50; // 랜덤 거리
    let x = mouseX + distance * Math.cos(angle);
    let y = mouseY + distance * Math.sin(angle);
    let delay = Math.random() * 0.2; // 짧은 딜레이

    gsap.to(star, {
      x: x,
      y: y,
      opacity: 1,
      duration: 0.5,
      delay: delay,
      onComplete: () => {
        gsap.to(star, { opacity: 0, duration: 0.5, onComplete: () => star.remove() });
      }
    });
  }
}