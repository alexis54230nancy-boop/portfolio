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

// ===== Lecture audio de la page =====
// On utilise la synthèse vocale du navigateur (Web Speech API).
const boutonAudio = document.querySelector('.bouton-audio');

if (!('speechSynthesis' in window)) {
    // Navigateur trop ancien : on cache le bouton
    boutonAudio.hidden = true;
} else {
    boutonAudio.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
            arreterLecture();
            return;
        }

        // On lit chaque titre, paragraphe et élément de liste l'un après l'autre
        const morceaux = document.querySelectorAll('main h1, main h2, main h3, main p, main li');
        morceaux.forEach((element, i) => {
            const phrase = new SpeechSynthesisUtterance(element.innerText);
            phrase.lang = 'fr-FR';
            if (i === morceaux.length - 1) {
                phrase.onend = arreterLecture;
            }
            speechSynthesis.speak(phrase);
        });

        boutonAudio.innerHTML = '<span aria-hidden="true">⏹</span> Arrêter';
        boutonAudio.setAttribute('aria-pressed', 'true');
    });

    // Si on change de page pendant la lecture, on coupe le son
    window.addEventListener('pagehide', () => speechSynthesis.cancel());
}

function arreterLecture() {
    speechSynthesis.cancel();
    boutonAudio.innerHTML = '<span aria-hidden="true">🔊</span> Écouter';
    boutonAudio.setAttribute('aria-pressed', 'false');
}
