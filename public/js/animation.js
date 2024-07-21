const animatedText = document.querySelector('.animated-text');
const message = document.querySelector('.message');

animatedText.addEventListener('mouseover', function() {
    message.textContent = "Thanks for hovering! 😊";
    message.style.opacity = "1";
});

animatedText.addEventListener('mouseout', function() {
    message.style.opacity = "0";
});

const textContent = "Hover over me!";
let index = 0;

function typeText() {
    if (index < textContent.length) {
        animatedText.textContent += textContent.charAt(index);
        index++;
        setTimeout(typeText, 100);
    } else {
        animatedText.style.borderRight = "none";
    }
}

typeText();

// 3D 효과
document.addEventListener('mousemove', (e) => {
  const mouseX = e.clientX / window.innerWidth - 0.5;
  const mouseY = e.clientY / window.innerHeight - 0.5;
  const rotationX = mouseY * 10;
  const rotationY = mouseX * -10;
  document.querySelector('.text-container').style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
});

// 파티클 애니메이션
const particlesDiv = document.querySelector('.particles');
for (let i = 0; i < 100; i++) {
  const particle = document.createElement('div');
  particle.classList.add('particle');
  particle.style.left = `${Math.random() * 100}vw`;
  particle.style.top = `${Math.random() * 100}vh`;
  particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
  particle.style.animationDelay = `${Math.random() * 5}s`;
  particlesDiv.appendChild(particle);
}