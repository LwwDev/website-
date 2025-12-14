"use strict";
// main app code for portfolio site
// section switching logic
let currentSection = 'home';
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        }
        else {
            section.classList.remove('active');
        }
    });
    // update nav links too
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === '#' + sectionId) {
            link.classList.add('active');
        }
        else {
            link.classList.remove('active');
        }
    });
    currentSection = sectionId;
}
// setup navigation
function setupNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                const sectionId = href.replace('#', '');
                showSection(sectionId);
                // update url
                window.history.pushState(null, '', href);
            }
        });
    });
}
// handle browser back/forward
function handleBrowserNav() {
    window.addEventListener('popstate', () => {
        let hash = window.location.hash;
        if (hash) {
            const sectionId = hash.replace('#', '');
            showSection(sectionId);
        }
        else {
            showSection('home');
        }
    });
}
// check url on page load
function checkInitialUrl() {
    let hash = window.location.hash;
    if (hash) {
        const sectionId = hash.replace('#', '');
        const section = document.getElementById(sectionId);
        if (section) {
            showSection(sectionId);
        }
        else {
            showSection('home');
        }
    }
}
// setup feature links
function setupFeatureLinks() {
    const featureLinks = document.querySelectorAll('.feature-link');
    featureLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                const sectionId = href.replace('#', '');
                showSection(sectionId);
                window.history.pushState(null, '', href);
            }
        });
    });
}
// setup email copy functionality
function setupEmailCopy() {
    const emailElement = document.querySelector('.email-copy');
    if (emailElement) {
        emailElement.addEventListener('click', () => {
            const email = emailElement.getAttribute('data-email');
            if (email) {
                // copy to clipboard
                navigator.clipboard.writeText(email).then(() => {
                    // show copied feedback
                    emailElement.classList.add('copied');
                    setTimeout(() => {
                        emailElement.classList.remove('copied');
                    }, 2000);
                });
            }
        });
    }
}
// init everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupNav();
    handleBrowserNav();
    checkInitialUrl();
    setupFeatureLinks();
    setupEmailCopy();
    console.log('site loaded!');
});
//# sourceMappingURL=app.js.map