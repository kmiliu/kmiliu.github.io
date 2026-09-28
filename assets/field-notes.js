/* Progressive enhancements: reading progress and full, uncropped photographs. */
(() => {
    const article = document.querySelector('article');
    if (!article) return;
    const progress = document.createElement('div');
    progress.className = 'note-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.prepend(progress);
    let scheduled = false;
    const update = () => {
        const start = article.offsetTop;
        const distance = article.offsetHeight - window.innerHeight;
        const value = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, distance)));
        progress.style.transform = `scaleX(${value})`;
        scheduled = false;
    };
    window.addEventListener('scroll', () => {
        if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
    }, { passive: true });
    new ResizeObserver(update).observe(article);
    window.addEventListener('resize', update);
    update();

    if (!('HTMLDialogElement' in window)) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'note-image-dialog';
    dialog.setAttribute('aria-label', 'Image at full size');
    const form = document.createElement('form');
    form.method = 'dialog';
    const close = document.createElement('button');
    close.textContent = 'Close image ×';
    form.append(close);
    const fullImage = document.createElement('img');
    const caption = document.createElement('p');
    dialog.append(form, fullImage, caption);
    document.body.append(dialog);
    let trigger = null;
    let previousOverflow = '';
    document.querySelectorAll('[data-expand-image]').forEach(image => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'note-image-button';
        button.setAttribute('aria-label', `View full image: ${image.alt}`);
        button.setAttribute('aria-haspopup', 'dialog');
        const cue = document.createElement('span');
        cue.textContent = 'Look closer ↗';
        cue.setAttribute('aria-hidden', 'true');
        image.before(button);
        button.append(image, cue);
        button.addEventListener('click', () => {
            fullImage.src = image.currentSrc || image.src;
            fullImage.alt = image.alt;
            caption.textContent = image.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
            trigger = button;
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            dialog.showModal();
        });
    });
    dialog.addEventListener('close', () => {
        document.body.style.overflow = previousOverflow;
        trigger?.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
})();
