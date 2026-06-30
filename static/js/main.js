// Main JavaScript file for UniBridge

// Simple Micro-interactions
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mousedown', () => {
            el.classList.add('scale-95');
        });
        el.addEventListener('mouseup', () => {
            el.classList.remove('scale-95');
        });
        el.addEventListener('mouseleave', () => {
            el.classList.remove('scale-95');
        });
    });
});

// Initialize progress rings
window.addEventListener('DOMContentLoaded', () => {
    const circle = document.querySelector('.progress-ring__circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        // Set to 65% as per content
        const offset = circumference - (65 / 100 * circumference);
        circle.style.strokeDashoffset = offset;
    }
});
