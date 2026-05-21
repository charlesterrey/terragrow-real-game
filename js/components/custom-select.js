// js/components/custom-select.js — Custom dropdown conforme au design system Marcassin
// Remplace les <select> natifs par un dropdown stylable

export function initCustomSelects(container = document) {
  container.querySelectorAll('select[data-custom]').forEach(select => {
    if (select.dataset.customized) return;
    select.dataset.customized = 'true';
    createCustomSelect(select);
  });
}

function createCustomSelect(originalSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cs-wrapper';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  wrapper.style.width = originalSelect.style.width || '';
  wrapper.style.minWidth = originalSelect.style.minWidth || '200px';
  wrapper.style.flex = originalSelect.style.flex || '';

  // Trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  // Dropdown panel
  const dropdown = document.createElement('div');
  dropdown.className = 'cs-dropdown';
  dropdown.setAttribute('role', 'listbox');

  function buildOptions() {
    dropdown.innerHTML = '';
    for (const child of originalSelect.children) {
      if (child.tagName === 'OPTGROUP') {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'cs-group-label';
        groupLabel.textContent = child.label;
        dropdown.appendChild(groupLabel);
        for (const opt of child.children) {
          dropdown.appendChild(createOption(opt));
        }
      } else if (child.tagName === 'OPTION') {
        dropdown.appendChild(createOption(child));
      }
    }
  }

  function createOption(opt) {
    const item = document.createElement('div');
    item.className = 'cs-option';
    item.dataset.value = opt.value;
    item.setAttribute('role', 'option');
    item.textContent = opt.textContent;
    if (opt.selected) item.classList.add('selected');
    if (opt.disabled) { item.classList.add('disabled'); item.setAttribute('aria-disabled', 'true'); }

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (opt.disabled) return;
      originalSelect.value = opt.value;
      originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
      updateTrigger();
      close();
    });
    return item;
  }

  function updateTrigger() {
    const selected = originalSelect.options[originalSelect.selectedIndex];
    trigger.innerHTML = `
      <span class="cs-trigger-text">${selected ? selected.textContent : 'Sélectionner...'}</span>
      <svg class="cs-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;
    // Update selected state in dropdown
    dropdown.querySelectorAll('.cs-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.value === originalSelect.value);
    });
  }

  function open() {
    dropdown.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('open');
    // Position
    const rect = wrapper.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 240) {
      dropdown.style.bottom = '100%';
      dropdown.style.top = 'auto';
      dropdown.style.marginBottom = '4px';
      dropdown.style.marginTop = '0';
    } else {
      dropdown.style.top = '100%';
      dropdown.style.bottom = 'auto';
      dropdown.style.marginTop = '4px';
      dropdown.style.marginBottom = '0';
    }
    // Scroll to selected
    const sel = dropdown.querySelector('.cs-option.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function close() {
    dropdown.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('open');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains('open')) { close(); } else { open(); }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) close();
  });

  // Keyboard
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (dropdown.classList.contains('open')) close(); else open(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); open(); const first = dropdown.querySelector('.cs-option:not(.disabled)'); if (first) first.focus(); }
  });

  // Hide original, insert custom
  originalSelect.style.display = 'none';
  originalSelect.parentNode.insertBefore(wrapper, originalSelect);
  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);
  wrapper.appendChild(originalSelect);

  buildOptions();
  updateTrigger();

  // Observe changes to original select
  const observer = new MutationObserver(() => { buildOptions(); updateTrigger(); });
  observer.observe(originalSelect, { childList: true, subtree: true, attributes: true });

  // Re-sync if value changes programmatically
  originalSelect.addEventListener('_refresh', () => { buildOptions(); updateTrigger(); });
}
