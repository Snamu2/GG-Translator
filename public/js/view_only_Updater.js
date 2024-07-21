document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  socket.on('translation update', (data) => {
    updateTranslation(data.AIResult);
  });

  const updateTranslation = (AIResult) => {
    const languages = [
      { code: 'kor', name: 'Korean' },
      { code: 'eng', name: 'English' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'chs', name: 'Chinese (Simplified)' },
      { code: 'cht', name: 'Chinese (Traditional)' },
      { code: 'vie', name: 'Vietnamese' },
      { code: 'ind', name: 'Indonesian' },
      { code: 'tha', name: 'Thai' },
      { code: 'deu', name: 'German' },
      { code: 'rus', name: 'Russian' },
      { code: 'spa', name: 'Spanish' },
      { code: 'ita', name: 'Italian' },
      { code: 'fra', name: 'French' },
      { code: 'hin', name: 'Hindi' },
      { code: 'ara', name: 'Arabic' },
      { code: 'por', name: 'Portuguese' },
      { code: 'tur', name: 'Turkish' }
    ];

    const activeLanguages = JSON.parse(localStorage.getItem('activeLanguages')) || [];

    // 기존 섹션을 업데이트
    languages.forEach(function(language) {
      const section = document.getElementById(language.code);
      if (section) {
        const paragraph = document.getElementById(`translation-${language.code}`);
        if (paragraph) {
          let content = 'No translation available';
          AIResult.split('\n').forEach(function(line) {
            if (line.toLowerCase().startsWith(language.code)) {
              content = line.split(': ')[1] || content;
            }
          });
          paragraph.innerText = content;

          // Show or hide the section based on activeLanguages
          if (activeLanguages.includes(language.code)) {
            section.style.display = 'block';
            section.classList.add('active');
          } else {
            section.style.display = 'none';
            section.classList.remove('active');
          }
        }
      }
    });

    document.querySelectorAll('.btn').forEach(button => {
      const language = button.getAttribute('data-language');
      if (activeLanguages.includes(language)) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  };
});