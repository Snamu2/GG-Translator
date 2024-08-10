document.addEventListener('DOMContentLoaded', function() {
  const banner = document.getElementById('new-app-banner');
  const bannerTab = banner.querySelector('.banner-tab');
  const tryDictionaryBtn = document.getElementById('try-dictionary-btn');
  
  tryDictionaryBtn.addEventListener('click', function() {
    window.location.href = '/dictionary';
  });

  // 5초 후 배너 접기
  setTimeout(function() {
    banner.classList.add('collapsed');
  }, 5000);

  // 배너 탭에 호버 이벤트 추가
  bannerTab.addEventListener('mouseenter', function() {
    banner.classList.remove('collapsed');
  });

  // 배너 전체에 마우스 나가기 이벤트 추가
  banner.addEventListener('mouseleave', function() {
    banner.classList.add('collapsed');
  });
});