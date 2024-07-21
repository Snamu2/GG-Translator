document.addEventListener('DOMContentLoaded', function() {
  // Search functionality
  const searchInput = document.createElement('input');
  searchInput.setAttribute('type', 'text');
  searchInput.setAttribute('placeholder', 'Search Auth...');
  searchInput.id = 'searchInput';
  searchInput.style.marginBottom = '20px';
  searchInput.style.padding = '10px';
  searchInput.style.width = '96%';

  const container = document.querySelector('.container');
  container.insertBefore(searchInput, container.firstChild);

  searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      const listBoxes = document.querySelectorAll('.list-box');

      listBoxes.forEach(box => {
          const title = box.querySelector('h4').innerText.toLowerCase();
          if (title.includes(query)) {
              box.style.display = 'block';
          } else {
              box.style.display = 'none';
          }
      });
  });

  // Hover animation for list items
  const listBoxes = document.querySelectorAll('.list-box');
  listBoxes.forEach(box => {
      box.addEventListener('mouseover', function() {
          this.style.transform = 'scale(1.02)';
      });
      box.addEventListener('mouseout', function() {
          this.style.transform = 'scale(1)';
      });
  });
});
