(async () => {
const api = document.querySelector('meta[name="studio-api"]').content ||
  (location.hostname === '127.0.0.1' ? location.origin : '');
let displayWorks = Object.entries(projects);
if (api) {
  try {
    const endpoint = new URL('/api/public', api);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('无法读取共享作品');
    const { works, profile } = await response.json();
    displayWorks = works.map(work => {
      for (const field of ['cover', 'video', 'poster', 'detailImage']) {
        if (work[field]) work[field] = new URL(work[field], endpoint.origin + '/').href;
      }
      return [work.key, work];
    });
    for (const [field, value] of Object.entries(profile)) {
      if (value) document.getElementById('profile-' + field)?.replaceChildren(value);
    }
  } catch (error) {
    console.warn(error);
  }
}
const visibleProjects = new Map(displayWorks);
const dialog = document.querySelector('#project-dialog');
const image = document.querySelector('#dialog-image');
const video = document.querySelector('#dialog-video');
let activeProject;

const filmWindow = document.querySelector('.film-window');
const filmStrip = filmWindow.querySelector('.film-strip');
const designGallery = document.querySelector('.design-cases');
const filmToggle = document.querySelector('#film-toggle');
let filmCount = 0;
let designCount = 0;

for (const [key, project] of displayWorks) {
  const isFilm = Boolean(project.video);
  const card = document.createElement('button');
  card.className = 'project';
  card.type = 'button';
  card.dataset.project = key;
  card.innerHTML = `<div class="media"><img alt="" loading="lazy"><span class="media-action" aria-hidden="true"></span></div>
    <div class="card-info"><div><span class="tag"></span><h3></h3></div><span class="index"></span></div>`;
  const cover = card.querySelector('img');
  cover.src = project.cover;
  cover.alt = project.alt;
  card.querySelector('.tag').textContent = project.tag;
  card.querySelector('h3').textContent = project.title;
  card.querySelector('.media-action').textContent = isFilm ? '▶' : '↗';
  const number = isFilm ? ++filmCount : ++designCount;
  card.querySelector('.index').textContent = String(number).padStart(2, '0');
  (isFilm ? filmStrip : designGallery).append(card);
}

for (const gallery of [filmStrip, designGallery]) {
  gallery.addEventListener('click', event => {
    const button = event.target.closest('[data-project]');
    if (!button) return;
    const project = visibleProjects.get(button.dataset.project);
    activeProject = button;
    const isFilm = Boolean(project.video);
    dialog.classList.toggle('film-detail', isFilm);
    image.hidden = isFilm;
    video.hidden = !isFilm;
    if (isFilm) {
      video.poster = project.poster || project.cover;
      video.src = project.video;
      video.setAttribute('aria-label', project.title);
    } else {
      image.src = project.detailImage || project.cover;
      image.alt = project.alt;
    }
    document.querySelector('#dialog-title').textContent = project.title;
    document.querySelector('#dialog-type').textContent = project.type;
    document.querySelector('#dialog-description').textContent = project.description;
    dialog.showModal();
  });
}

dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.load();
  activeProject?.focus();
});

const track = document.querySelector('.hero-track');
const hero = document.querySelector('.hero');
let framePending = false;

function updateHero() {
  const distance = Math.max(1, track.offsetHeight - hero.offsetHeight);
  const progress = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance));
  hero.style.setProperty('--zoom', 1 + progress * .15);
  hero.style.setProperty('--lift', progress * 72 + 'px');
  hero.style.setProperty('--fade', 1 - progress * .68);
  framePending = false;
}

function scheduleUpdate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(updateHero);
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);

const navigation = [...document.querySelectorAll('.header nav a')];
const sections = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const link = navigation.find(item => item.hash === '#' + entry.target.id);
    link.classList.toggle('active', entry.isIntersecting);
    if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}, { rootMargin: '-25% 0px -55% 0px' });

navigation.forEach(link => sections.observe(document.querySelector(link.hash)));

document.querySelector('#brief').addEventListener('click', async () => {
  const brief = '项目名称：\n目标与受众：\n所需服务（拍摄／剪辑／平面／UI／UX）：\n交付内容与使用渠道：\n预计时间：\n预算范围：\n参考链接：';
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(brief);
    status.textContent = '已复制项目简报模板。';
  } catch {
    status.textContent = brief;
    status.style.whiteSpace = 'pre-line';
  }
});


const motion = matchMedia('(prefers-reduced-motion: reduce)');
const filmCards = [...filmStrip.children];
let rolling = !motion.matches;
let filmVisible = false;
let filmHovered = false;
let repeatWidth = 0;
let position = 0;
let lastFrame = 0;
let animationFrame;

function tickFilm(now) {
  if (lastFrame) position = (position + Math.min(now - lastFrame, 64) * 0.038) % repeatWidth;
  filmWindow.scrollLeft = position;
  lastFrame = now;
  animationFrame = requestAnimationFrame(tickFilm);
}

function syncFilm() {
  cancelAnimationFrame(animationFrame);
  lastFrame = 0;
  filmToggle.textContent = rolling ? '暂停滚动' : '播放滚动';
  if (rolling && filmVisible && !filmHovered && !document.hidden && !dialog.open &&
      !filmWindow.contains(document.activeElement) && repeatWidth) {
    position = filmWindow.scrollLeft % repeatWidth;
    animationFrame = requestAnimationFrame(tickFilm);
  }
}

function sizeFilm() {
  const previousWidth = repeatWidth;
  filmStrip.querySelectorAll('[data-repeat]').forEach(card => card.remove());
  if (filmCards.length < 2) return;
  // Repeat the sequence until the viewport still has content after one full cycle.
  const appendCycle = () => filmCards.forEach(card => {
    const copy = card.cloneNode(true);
    copy.dataset.repeat = '';
    copy.tabIndex = -1;
    copy.setAttribute('aria-hidden', 'true');
    filmStrip.append(copy);
  });
  appendCycle();
  repeatWidth = filmStrip.children[filmCards.length].offsetLeft - filmCards[0].offsetLeft;
  while (repeatWidth && filmStrip.scrollWidth < repeatWidth + filmWindow.clientWidth) appendCycle();
  if (previousWidth !== repeatWidth && repeatWidth) filmWindow.scrollLeft %= repeatWidth;
  syncFilm();
}

filmToggle.hidden = filmCards.length < 2;
filmToggle.addEventListener('click', () => {
  rolling = !rolling;
  syncFilm();
});
filmWindow.addEventListener('pointerenter', event => {
  if (event.pointerType === 'mouse') filmHovered = true;
  syncFilm();
});
filmWindow.addEventListener('pointerleave', () => {
  filmHovered = false;
  syncFilm();
});
filmWindow.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse') return;
  rolling = false;
  syncFilm();
});
filmWindow.addEventListener('focusin', syncFilm);
filmWindow.addEventListener('focusout', () => queueMicrotask(syncFilm));
dialog.addEventListener('close', syncFilm);
filmStrip.addEventListener('click', syncFilm);
designGallery.addEventListener('click', syncFilm);
document.addEventListener('visibilitychange', syncFilm);
motion.addEventListener('change', () => {
  rolling = !motion.matches;
  syncFilm();
});
new IntersectionObserver(([entry]) => {
  filmVisible = entry.isIntersecting;
  syncFilm();
}).observe(filmWindow);
new ResizeObserver(sizeFilm).observe(filmWindow);
sizeFilm();

const designPrev = document.querySelector('#design-prev');
const designNext = document.querySelector('#design-next');

function syncDesignControls() {
  designPrev.disabled = designGallery.scrollLeft <= 1;
  designNext.disabled = designGallery.scrollLeft >= designGallery.scrollWidth - designGallery.clientWidth - 1;
}

function moveDesign(direction) {
  const first = designGallery.children[0];
  const second = designGallery.children[1];
  if (first && second) designGallery.scrollBy({ left: direction * (second.offsetLeft - first.offsetLeft) });
}

designPrev.addEventListener('click', () => moveDesign(-1));
designNext.addEventListener('click', () => moveDesign(1));
designGallery.addEventListener('scroll', syncDesignControls, { passive: true });
new ResizeObserver(syncDesignControls).observe(designGallery);
syncDesignControls();
updateHero();

})();
