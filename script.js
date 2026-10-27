console.log("Le JS marche !")
const progressBars = document.querySelectorAll('.progress-bar');
progressBars.forEach(bar => {
    const progress = bar.querySelector('.progress');
    const width = progress.style.width;
    progress.style.width = '0';
    setTimeout(() => {
        progress.style.width = width;
    }, 100);
});

// ===== Menu burger (téléphone) =====
const nav = document.querySelector('nav');
const burger = document.querySelector('.burger');

burger.addEventListener('click', () => {
    const ouvert = nav.classList.toggle('ouvert');
    burger.setAttribute('aria-expanded', ouvert);
    burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
});
