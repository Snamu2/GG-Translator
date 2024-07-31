document.addEventListener('DOMContentLoaded', () => {
  var buttons = document.querySelectorAll('.btn');
  var gridToggle = document.getElementById('toggle-grid');
  var translationContainer = document.getElementById('translation-container');
  
  // 마지막으로 클릭한 버튼과 섹션 상태 복원
  var activeLanguages = JSON.parse(localStorage.getItem('activeLanguages')) || [];
  activeLanguages.forEach(function(language) {
    var activeButton = document.querySelector(`button[data-language="${language}"]`);
    if (activeButton) {
      toggleLanguage(language, activeButton, false);
    }
  });
  
  buttons.forEach(function(button) {
    button.addEventListener('click', () => {
      var language = button.getAttribute('data-language');
      toggleLanguage(language, button, true);
    });
  });

  // 그리드 레이아웃 토글
  gridToggle.addEventListener('click', () => {
    if (translationContainer.classList.contains('grid')) {
      // 그리드 해제 시 애니메이션
      var activeSections = document.querySelectorAll('.language-section.active');
      activeSections.forEach(function(section) {
        gsap.to(section, {
          opacity: 0,
          y: 50,
          duration: 0.5,
          onComplete: () => {
            section.style.flex = '1 1 calc(100% - 20px)';
            gsap.to(section, { opacity: 1, y: 0, duration: 0.5 });
          }
        });
      });
    } else {
      // 그리드 설정 시 애니메이션
      var activeSections = document.querySelectorAll('.language-section.active');
      activeSections.forEach(function(section) {
        gsap.to(section, {
          opacity: 0,
          y: 50,
          duration: 0.5,
          onComplete: () => {
            section.style.flex = '1 1 calc(50% - 20px)';
            gsap.to(section, { opacity: 1, y: 0, duration: 0.5 });
          }
        });
      });
    }
    translationContainer.classList.toggle('grid');
    gridToggle.classList.toggle('grid-active');
  });

  // 드래그 앤 드롭 기능
  new Sortable(translationContainer, {
    animation: 150,
    handle: '.language-section',
    ghostClass: 'sortable-ghost',
    onStart: function(evt) {
      evt.item.classList.add('dragging');
    },
    onEnd: function(evt) {
      evt.item.classList.remove('dragging');
      // 드래그 앤 드롭 후 이벤트 핸들러
      // console.log('Drag ended:', evt);
    }
  });
});

function toggleLanguage(language, button, saveState) {
  var activeSection = document.getElementById(language);
  
  // 해당 섹션이 이미 활성화된 경우 비활성화
  if (activeSection.classList.contains('active')) {
    gsap.to(activeSection, {
      opacity: 0,
      y: 50,
      duration: 0.5,
      onComplete: () => {
        activeSection.classList.remove('active');
        activeSection.style.display = 'none';
      }
    });
    button.classList.remove('active');
    if (saveState) {
      var activeLanguages = JSON.parse(localStorage.getItem('activeLanguages')) || [];
      var index = activeLanguages.indexOf(language);
      if (index !== -1) {
        activeLanguages.splice(index, 1);
        localStorage.setItem('activeLanguages', JSON.stringify(activeLanguages));
      }
    }
  } else {
    // 섹션을 활성화
    activeSection.style.display = 'block';
    gsap.fromTo(activeSection, { opacity: 0, y: 50 }, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      onStart: () => {
        activeSection.classList.add('active');
      }
    });
    button.classList.add('active');
    if (saveState) {
      var activeLanguages = JSON.parse(localStorage.getItem('activeLanguages')) || [];
      if (!activeLanguages.includes(language)) {
        activeLanguages.push(language);
        localStorage.setItem('activeLanguages', JSON.stringify(activeLanguages));
      }
    }
  }
}

document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', () => {
    gsap.fromTo(button, {scale: 1}, {scale: 1.1, duration: 0.1, yoyo: true, repeat: 1});
  });
});

window.onload = function() {
  gsap.from('.container', {opacity: 0, y: -50, duration: 1});
}

document.querySelector('#refresh').addEventListener('click', () => {
  window.location.reload();
})

document.querySelectorAll('.language-section').forEach(section => {
  const copyButton = section.querySelector('.copy-button');
  const ttsButton = section.querySelector('.tts-button');

  copyButton.addEventListener('click', () => {
    const textToCopy = section.querySelector('p').innerText;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        const checkIcon = section.querySelector('.check-icon');
        checkIcon.classList.add('show-check');

        setTimeout(() => {
          checkIcon.classList.remove('show-check');
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy text.', err);
      });
  });

  ttsButton.addEventListener('click', () => {
    const textToSpeak = section.querySelector('p').innerText;
    const speech = new SpeechSynthesisUtterance(textToSpeak);
    speechSynthesis.speak(speech);
  });
});
