const STORAGE_KEY = 'balkan-ride-2027-logistics';

function readChecklistState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error('Gespeicherte Logistik-Häkchen konnten nicht gelesen werden.', error);
    return {};
  }
}

export function renderLogisticsChecklist({ container, markdown, marked, DOMPurify }) {
  container.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
  container.querySelector(':scope > h1')?.remove();
  const state = readChecklistState();
  const checkboxes = [...container.querySelectorAll('input[type="checkbox"]')];

  checkboxes.forEach((checkbox, index) => {
    checkbox.disabled = false;
    checkbox.checked = Boolean(state[index]);
    checkbox.setAttribute('aria-label', checkbox.closest('li')?.textContent.trim() || `Logistikpunkt ${index + 1}`);
    checkbox.addEventListener('change', () => {
      state[index] = checkbox.checked;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Logistik-Häkchen konnten nicht gespeichert werden.', error);
      }
    });
  });
}
