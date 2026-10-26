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
