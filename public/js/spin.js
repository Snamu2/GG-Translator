document.addEventListener("DOMContentLoaded", () => {
  const discordApp = document.getElementById("discord-app");
  const spinElement = discordApp.querySelector(".spin");

  let animation;

  discordApp.addEventListener("mouseenter", () => {
    animation = gsap.to(spinElement, {
      rotation: "+=360",
      duration: 0.75,
      ease: "power1.inOut",
      repeat: -1,
      onRepeat: () => {
        gsap.to(spinElement, {
          rotation: "+=360",
          duration: 0.75,
          ease: "power1.inOut"
        });
      },
      paused: true
    });

    animation.play();
  });

  discordApp.addEventListener("mouseleave", () => {
    animation.pause();
    gsap.to(spinElement, {
      rotation: 0,
      duration: 0.75,
      ease: "power1.inOut"
    });
  });
});
