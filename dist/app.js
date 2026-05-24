"use strict";
const sectionIds = ['work', 'projects', 'about', 'uses', 'library', 'travel', 'keyboards', 'board', 'notes', 'game'];
let currentSection = 'work';
function scrollToSection(sectionId, pushHistory = true) {
    const section = document.getElementById(sectionId);
    if (!section)
        return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    currentSection = sectionId;
    if (pushHistory) {
        window.history.pushState(null, '', `#${sectionId}`);
    }
}
function setupHashNavigation() {
    if (window.location.hash) {
        const sectionId = window.location.hash.replace('#', '');
        if (sectionIds.includes(sectionId)) {
            requestAnimationFrame(() => scrollToSection(sectionId, false));
        }
    }
    window.addEventListener('popstate', () => {
        const sectionId = window.location.hash.replace('#', '');
        if (sectionIds.includes(sectionId)) {
            scrollToSection(sectionId, false);
        }
    });
}
// setup email copy functionality
function setupEmailCopy() {
    document.querySelectorAll('.email-copy').forEach(emailElement => {
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
    });
}
function setupCursorFx() {
    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointerQuery.matches)
        return;
    const dotElement = document.getElementById('cursor-dot');
    const ringElement = document.getElementById('cursor-ring');
    const canvasElement = document.getElementById('cursor-fx');
    if (!(dotElement instanceof HTMLDivElement) ||
        !(ringElement instanceof HTMLDivElement) ||
        !(canvasElement instanceof HTMLCanvasElement)) {
        return;
    }
    const dot = dotElement;
    const ring = ringElement;
    const canvas = canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    const context = ctx;
    document.body.classList.add('has-custom-cursor');
    if (!reducedMotionQuery.matches) {
        document.body.classList.add('has-pointer-fx');
    }
    const interactiveSelector = [
        'a',
        'button',
        'input',
        'textarea',
        'select',
        'canvas',
        '[role="tab"]',
        '.email-copy',
        '.kanban-ticket',
    ].join(', ');
    let visible = false;
    let hoveringInteractive = false;
    let pressing = false;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let dotX = targetX;
    let dotY = targetY;
    let ringX = targetX;
    let ringY = targetY;
    let lastSparkX = targetX;
    let lastSparkY = targetY;
    const sparks = [];
    function resizeFxCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function syncCursorClasses() {
        dot.classList.toggle('is-visible', visible);
        ring.classList.toggle('is-visible', visible);
        dot.classList.toggle('is-hovering', hoveringInteractive);
        ring.classList.toggle('is-hovering', hoveringInteractive);
        ring.classList.toggle('is-pressing', pressing);
    }
    function setVisible(nextVisible) {
        visible = nextVisible;
        syncCursorClasses();
    }
    function updateInteractiveState(target) {
        const element = target instanceof Element ? target.closest(interactiveSelector) : null;
        hoveringInteractive = element !== null;
        syncCursorClasses();
    }
    function spawnSparks(x, y, burst = 1) {
        if (reducedMotionQuery.matches)
            return;
        const count = burst > 1.2 ? 4 : 2;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (0.35 + Math.random() * 0.9) * burst;
            const life = 14 + Math.random() * 10;
            sparks.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.15,
                size: 2 + Math.random() * 3.6,
                life,
                maxLife: life,
                rotation: Math.random() * Math.PI,
                spin: -0.08 + Math.random() * 0.16,
            });
        }
    }
    function updatePointer(x, y, target) {
        targetX = x;
        targetY = y;
        setVisible(true);
        updateInteractiveState(target);
        const distance = Math.hypot(x - lastSparkX, y - lastSparkY);
        if (distance > 14) {
            spawnSparks(x, y, hoveringInteractive ? 1.25 : 1);
            lastSparkX = x;
            lastSparkY = y;
        }
    }
    function drawSparks() {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = sparks.length - 1; i >= 0; i--) {
            const spark = sparks[i];
            spark.life -= 1;
            if (spark.life <= 0) {
                sparks.splice(i, 1);
                continue;
            }
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.vx *= 0.96;
            spark.vy = spark.vy * 0.96 + 0.01;
            spark.rotation += spark.spin;
            const opacity = spark.life / spark.maxLife;
            const size = spark.size * (0.4 + opacity);
            context.save();
            context.translate(spark.x, spark.y);
            context.rotate(spark.rotation);
            context.globalAlpha = opacity * 0.6;
            context.strokeStyle = hoveringInteractive ? 'rgba(238,238,238,0.95)' : 'rgba(192,192,192,0.82)';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(-size, 0);
            context.lineTo(size, 0);
            context.moveTo(0, -size);
            context.lineTo(0, size);
            context.stroke();
            context.restore();
        }
    }
    function animate() {
        dotX += (targetX - dotX) * 0.35;
        dotY += (targetY - dotY) * 0.35;
        ringX += (targetX - ringX) * 0.18;
        ringY += (targetY - ringY) * 0.18;
        dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        drawSparks();
        requestAnimationFrame(animate);
    }
    window.addEventListener('mousemove', event => {
        updatePointer(event.clientX, event.clientY, event.target);
    }, { passive: true });
    window.addEventListener('mousedown', () => {
        pressing = true;
        syncCursorClasses();
        spawnSparks(targetX, targetY, 1.55);
    }, { passive: true });
    window.addEventListener('mouseup', () => {
        pressing = false;
        syncCursorClasses();
    }, { passive: true });
    window.addEventListener('mouseout', event => {
        if (!(event.relatedTarget instanceof Node)) {
            visible = false;
            pressing = false;
            syncCursorClasses();
        }
    });
    window.addEventListener('blur', () => {
        visible = false;
        pressing = false;
        syncCursorClasses();
    });
    window.addEventListener('resize', resizeFxCanvas);
    resizeFxCanvas();
    syncCursorClasses();
    animate();
}
function isLikelyIpAddress(value) {
    const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^[0-9a-f:]+$/i;
    return ipv4.test(value) || ipv6.test(value);
}
async function setupDynamicIntro() {
    const intro = document.getElementById('intro-message');
    if (!(intro instanceof HTMLElement))
        return;
    const setFallback = () => {
        intro.textContent = "Hello. You made it to my corner of the internet. This is where I keep the projects, experiments, and bits of life that have stuck with me.";
    };
    setFallback();
    try {
        const response = await fetch('https://api.ipify.org?format=json', {
            cache: 'no-store',
        });
        if (!response.ok) {
            setFallback();
            return;
        }
        const data = await response.json();
        const ip = typeof data.ip === 'string' ? data.ip.trim() : '';
        if (!ip || !isLikelyIpAddress(ip)) {
            setFallback();
            return;
        }
        const ipSpan = document.createElement('span');
        ipSpan.className = 'intro-ip';
        ipSpan.textContent = ip;
        intro.replaceChildren(document.createTextNode('Hello, '), ipSpan, document.createTextNode(". You made it to my corner of the internet. This is where I keep the projects, experiments, and bits of life that have stuck with me."));
    }
    catch {
        setFallback();
    }
}
function setupTravelMap() {
    const container = document.getElementById('travel-map');
    if (!(container instanceof HTMLElement))
        return;
    const mapContainer = container;
    const visitedCountryIds = new Set([
        '156', // China
        '158', // Taiwan
        '196', // Cyprus
        '208', // Denmark
        '233', // Estonia
        '246', // Finland
        '250', // France
        '276', // Germany
        '300', // Greece
        '344', // Hong Kong
        '388', // Jamaica
        '428', // Latvia
        '458', // Malaysia
        '470', // Malta
        '484', // Mexico
        '528', // Netherlands
        '578', // Norway
        '616', // Poland
        '620', // Portugal
        '643', // Russia
        '702', // Singapore
        '724', // Spain
        '752', // Sweden
        '756', // Switzerland
        '764', // Thailand
        '784', // United Arab Emirates
        '818', // Egypt
        '826', // United Kingdom
        '840', // United States of America
        '380', // Italy
    ]);
    const visitedCountryNames = new Set([
        'N. Cyprus',
    ]);
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
        container.textContent = 'Map libraries could not be loaded.';
        return;
    }
    let resizeRaf = 0;
    function isVisitedCountry(feature) {
        const id = typeof feature.id === 'string' ? feature.id : '';
        const name = typeof feature.properties?.name === 'string' ? feature.properties.name : '';
        return visitedCountryIds.has(id) || visitedCountryNames.has(name);
    }
    async function renderMap() {
        const width = Math.max(320, Math.floor(mapContainer.clientWidth || 960));
        const height = Math.max(320, Math.floor(width * 0.53));
        try {
            const response = await fetch('data/world-countries-50m.json', { cache: 'force-cache' });
            if (!response.ok)
                throw new Error('Map data request failed.');
            const world = await response.json();
            const countries = topojson.feature(world, world.objects.countries).features;
            const borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
            const graticule = d3.geoGraticule10();
            const projection = d3.geoNaturalEarth1()
                .fitExtent([[16, 20], [width - 16, height - 20]], { type: 'Sphere' });
            const path = d3.geoPath(projection);
            const svgNs = 'http://www.w3.org/2000/svg';
            mapContainer.innerHTML = '';
            const svg = document.createElementNS(svgNs, 'svg');
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            svg.setAttribute('aria-hidden', 'true');
            const sphere = document.createElementNS(svgNs, 'path');
            sphere.setAttribute('class', 'travel-sphere');
            sphere.setAttribute('d', path({ type: 'Sphere' }) || '');
            svg.appendChild(sphere);
            const graticulePath = document.createElementNS(svgNs, 'path');
            graticulePath.setAttribute('class', 'travel-graticule');
            graticulePath.setAttribute('d', path(graticule) || '');
            svg.appendChild(graticulePath);
            countries.forEach(feature => {
                const countryPath = document.createElementNS(svgNs, 'path');
                countryPath.setAttribute('class', isVisitedCountry(feature) ? 'travel-country is-visited' : 'travel-country');
                countryPath.setAttribute('d', path(feature) || '');
                const name = typeof feature.properties?.name === 'string' ? feature.properties.name : 'Country';
                countryPath.setAttribute('aria-label', name);
                svg.appendChild(countryPath);
            });
            const borderPath = document.createElementNS(svgNs, 'path');
            borderPath.setAttribute('class', 'travel-borders');
            borderPath.setAttribute('d', path(borders) || '');
            svg.appendChild(borderPath);
            mapContainer.appendChild(svg);
        }
        catch {
            mapContainer.textContent = 'Travel map could not be loaded right now.';
        }
    }
    void renderMap();
    window.addEventListener('resize', () => {
        window.cancelAnimationFrame(resizeRaf);
        resizeRaf = window.requestAnimationFrame(() => {
            void renderMap();
        });
    });
}
function setupActivityChart() {
    const canvas = document.getElementById('activity-chart');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 100;
    // fake hourly activity data (0-3000 scale)
    const data = [40, 25, 15, 10, 8, 20, 100, 350, 700, 1100, 1400, 1800,
        1600, 1400, 1200, 1000, 1100, 1600, 2400, 2900, 2700, 2100, 1200, 400];
    const max = Math.max(...data);
    const w = canvas.width;
    const h = canvas.height;
    const padY = 8;
    const pts = data.map((val, i) => ({
        x: (i / (data.length - 1)) * w,
        y: padY + (1 - val / max) * (h - padY * 2)
    }));
    // filled area
    ctx.beginPath();
    ctx.moveTo(pts[0].x, h);
    ctx.lineTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        const cpx = (pts[i - 1].x + pts[i].x) / 2;
        ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(170,170,170,0.12)');
    grad.addColorStop(1, 'rgba(170,170,170,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    // line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        const cpx = (pts[i - 1].x + pts[i].x) / 2;
        ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = '#5A5A5A';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}
function setupWeeklyGrid() {
    const grid = document.getElementById('weekly-grid');
    if (!grid)
        return;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // intensity 0-5 per time block (morning, midday, afternoon, evening, night, late)
    const patterns = [
        [0, 1, 2, 3, 2, 1],
        [0, 1, 3, 4, 4, 2],
        [0, 1, 3, 4, 5, 2],
        [0, 1, 2, 4, 4, 1],
        [0, 1, 3, 3, 5, 3],
        [0, 1, 3, 5, 5, 4],
        [0, 0, 1, 3, 4, 2],
    ];
    days.forEach((day, i) => {
        const col = document.createElement('div');
        col.className = 'week-col';
        const label = document.createElement('div');
        label.className = 'week-day-label';
        label.textContent = day;
        col.appendChild(label);
        patterns[i].forEach(intensity => {
            const cell = document.createElement('div');
            cell.className = 'week-cell' + (intensity > 0 ? ' i' + intensity : '');
            col.appendChild(cell);
        });
        grid.appendChild(col);
    });
}
function setupProjectArchiveTabs() {
    const tabButtons = Array.from(document.querySelectorAll('.project-tab-btn'));
    const panels = Array.from(document.querySelectorAll('.project-panel'));
    if (!tabButtons.length || !panels.length)
        return;
    function activateTab(panelName, focusTab = false) {
        tabButtons.forEach(button => {
            const isActive = button.dataset.panel === panelName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', String(isActive));
            button.tabIndex = isActive ? 0 : -1;
            if (focusTab && isActive)
                button.focus();
        });
        panels.forEach(panel => {
            const isActive = panel.id === `project-panel-${panelName}`;
            panel.classList.toggle('is-active', isActive);
            panel.hidden = !isActive;
        });
    }
    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const panelName = button.dataset.panel;
            if (panelName)
                activateTab(panelName);
        });
        button.addEventListener('keydown', event => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')
                return;
            event.preventDefault();
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (index + direction + tabButtons.length) % tabButtons.length;
            const nextButton = tabButtons[nextIndex];
            const nextPanel = nextButton.dataset.panel;
            if (nextPanel)
                activateTab(nextPanel, true);
        });
    });
}
const kanbanStorageKey = 'portfolio-jira-board-v1';
const kanbanColumnIds = ['backlog', 'selected', 'inprogress', 'done'];
const kanbanIssueTypes = ['story', 'task', 'bug'];
const kanbanPriorities = ['low', 'medium', 'high', 'highest'];
function isKanbanColumnId(value) {
    return kanbanColumnIds.includes(value);
}
function isKanbanIssueType(value) {
    return kanbanIssueTypes.includes(value);
}
function isKanbanPriority(value) {
    return kanbanPriorities.includes(value);
}
function createDefaultKanbanState() {
    const now = Date.now();
    const issues = [
        {
            id: 'issue-101',
            key: 'LW-101',
            summary: 'Tighten the hero spacing without losing the terminal feel',
            description: 'Keep the left side balanced against the fastfetch card and trim any awkward empty space.',
            type: 'story',
            priority: 'high',
            assignee: 'Liam',
            labels: ['portfolio', 'ui'],
            column: 'selected',
            updatedAt: now - 1000 * 60 * 45,
        },
        {
            id: 'issue-102',
            key: 'LW-102',
            summary: 'Make the site map feel closer to a real Obsidian graph',
            description: 'Keep the node cluster readable, calmer, and more centered around Liam.',
            type: 'task',
            priority: 'medium',
            assignee: 'Liam',
            labels: ['graph', 'typescript'],
            column: 'inprogress',
            updatedAt: now - 1000 * 60 * 18,
        },
        {
            id: 'issue-103',
            key: 'LW-103',
            summary: 'Fix the ASCII panel on narrow screens',
            description: 'Avoid ugly overflow on mobile and keep the art readable inside the hero box.',
            type: 'bug',
            priority: 'highest',
            assignee: 'Liam',
            labels: ['ascii', 'mobile'],
            column: 'inprogress',
            updatedAt: now - 1000 * 60 * 8,
        },
        {
            id: 'issue-104',
            key: 'LW-104',
            summary: 'Write a deeper case study for Linker',
            description: 'Turn one project card into a real story about the problem, decisions, and outcome.',
            type: 'story',
            priority: 'high',
            assignee: 'Liam',
            labels: ['projects', 'content'],
            column: 'backlog',
            updatedAt: now - 1000 * 60 * 120,
        },
        {
            id: 'issue-105',
            key: 'LW-105',
            summary: 'Buy groceries for the week',
            description: 'Coffee, eggs, fruit, chicken, pasta, and something easy for lunches.',
            type: 'task',
            priority: 'medium',
            assignee: 'Liam',
            labels: ['life', 'errands'],
            column: 'backlog',
            updatedAt: now - 1000 * 60 * 220,
        },
        {
            id: 'issue-106',
            key: 'LW-106',
            summary: 'Book laundry and clean the apartment',
            description: 'Quick reset task for the weekend so the next work week starts clean.',
            type: 'task',
            priority: 'low',
            assignee: 'Liam',
            labels: ['life', 'home'],
            column: 'backlog',
            updatedAt: now - 1000 * 60 * 260,
        },
        {
            id: 'issue-107',
            key: 'LW-107',
            summary: 'Plan a gym session after work',
            description: 'Keep it simple: 45 minutes, no overthinking, just get there.',
            type: 'task',
            priority: 'medium',
            assignee: 'Liam',
            labels: ['life', 'health'],
            column: 'selected',
            updatedAt: now - 1000 * 60 * 150,
        },
        {
            id: 'issue-108',
            key: 'LW-108',
            summary: 'Ship the fastfetch contact card refresh',
            description: 'Move the contact info into the hero terminal and keep the page footer cleaner.',
            type: 'task',
            priority: 'low',
            assignee: 'Liam',
            labels: ['hero', 'contact'],
            column: 'done',
            updatedAt: now - 1000 * 60 * 420,
        },
    ];
    return {
        issues,
        order: {
            backlog: ['issue-104', 'issue-105', 'issue-106'],
            selected: ['issue-101', 'issue-107'],
            inprogress: ['issue-102', 'issue-103'],
            done: ['issue-108'],
        },
        nextNumber: 109,
    };
}
function setupKanban() {
    const board = document.querySelector('.kanban-board');
    const searchInput = document.getElementById('kanban-search');
    const toolbarMeta = document.getElementById('kanban-toolbar-meta');
    const resetButton = document.getElementById('kanban-reset');
    const dialog = document.getElementById('kanban-dialog');
    const form = document.getElementById('kanban-form');
    const dialogMode = document.getElementById('kanban-dialog-mode');
    const dialogTitle = document.getElementById('kanban-dialog-title');
    const closeButton = document.getElementById('kanban-dialog-close');
    const cancelButton = document.getElementById('kanban-cancel-btn');
    const deleteButton = document.getElementById('kanban-delete-btn');
    const saveButton = document.getElementById('kanban-save-btn');
    const summaryInput = document.getElementById('kanban-summary-input');
    const descriptionInput = document.getElementById('kanban-description-input');
    const typeInput = document.getElementById('kanban-type-input');
    const priorityInput = document.getElementById('kanban-priority-input');
    const statusInput = document.getElementById('kanban-status-input');
    const assigneeInput = document.getElementById('kanban-assignee-input');
    const labelsInput = document.getElementById('kanban-labels-input');
    const filterButtons = Array.from(document.querySelectorAll('.kanban-filter-btn'));
    const addButtons = Array.from(document.querySelectorAll('.kanban-add-btn'));
    const backlogContainer = document.getElementById('kcards-backlog');
    const selectedContainer = document.getElementById('kcards-selected');
    const inprogressContainer = document.getElementById('kcards-inprogress');
    const doneContainer = document.getElementById('kcards-done');
    const backlogCount = document.getElementById('kcount-backlog');
    const selectedCount = document.getElementById('kcount-selected');
    const inprogressCount = document.getElementById('kcount-inprogress');
    const doneCount = document.getElementById('kcount-done');
    if (!(board instanceof HTMLElement) ||
        !(searchInput instanceof HTMLInputElement) ||
        !(toolbarMeta instanceof HTMLElement) ||
        !(resetButton instanceof HTMLButtonElement) ||
        !(dialog instanceof HTMLDialogElement) ||
        !(form instanceof HTMLFormElement) ||
        !(dialogMode instanceof HTMLElement) ||
        !(dialogTitle instanceof HTMLElement) ||
        !(closeButton instanceof HTMLButtonElement) ||
        !(cancelButton instanceof HTMLButtonElement) ||
        !(deleteButton instanceof HTMLButtonElement) ||
        !(saveButton instanceof HTMLButtonElement) ||
        !(summaryInput instanceof HTMLInputElement) ||
        !(descriptionInput instanceof HTMLTextAreaElement) ||
        !(typeInput instanceof HTMLSelectElement) ||
        !(priorityInput instanceof HTMLSelectElement) ||
        !(statusInput instanceof HTMLSelectElement) ||
        !(assigneeInput instanceof HTMLInputElement) ||
        !(labelsInput instanceof HTMLInputElement) ||
        !(backlogContainer instanceof HTMLElement) ||
        !(selectedContainer instanceof HTMLElement) ||
        !(inprogressContainer instanceof HTMLElement) ||
        !(doneContainer instanceof HTMLElement) ||
        !(backlogCount instanceof HTMLElement) ||
        !(selectedCount instanceof HTMLElement) ||
        !(inprogressCount instanceof HTMLElement) ||
        !(doneCount instanceof HTMLElement)) {
        return;
    }
    const searchInputEl = searchInput;
    const toolbarMetaEl = toolbarMeta;
    const resetButtonEl = resetButton;
    const dialogEl = dialog;
    const formEl = form;
    const dialogModeEl = dialogMode;
    const dialogTitleEl = dialogTitle;
    const closeButtonEl = closeButton;
    const cancelButtonEl = cancelButton;
    const deleteButtonEl = deleteButton;
    const saveButtonEl = saveButton;
    const summaryInputEl = summaryInput;
    const descriptionInputEl = descriptionInput;
    const typeInputEl = typeInput;
    const priorityInputEl = priorityInput;
    const statusInputEl = statusInput;
    const assigneeInputEl = assigneeInput;
    const labelsInputEl = labelsInput;
    const columnContainers = {
        backlog: backlogContainer,
        selected: selectedContainer,
        inprogress: inprogressContainer,
        done: doneContainer,
    };
    const countElements = {
        backlog: backlogCount,
        selected: selectedCount,
        inprogress: inprogressCount,
        done: doneCount,
    };
    const columnElements = {
        backlog: backlogContainer.closest('.kanban-col'),
        selected: selectedContainer.closest('.kanban-col'),
        inprogress: inprogressContainer.closest('.kanban-col'),
        done: doneContainer.closest('.kanban-col'),
    };
    let state = loadKanbanState();
    let activeFilter = 'all';
    let searchTerm = '';
    let draggedIssueId = null;
    let editingIssueId = null;
    function loadKanbanState() {
        const fallback = createDefaultKanbanState();
        try {
            const raw = window.localStorage.getItem(kanbanStorageKey);
            if (!raw)
                return fallback;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.issues))
                return fallback;
            const issues = parsed.issues
                .filter((issue) => {
                if (!issue || typeof issue !== 'object')
                    return false;
                const candidate = issue;
                return typeof candidate.id === 'string' &&
                    typeof candidate.key === 'string' &&
                    typeof candidate.summary === 'string' &&
                    typeof candidate.description === 'string' &&
                    typeof candidate.assignee === 'string' &&
                    Array.isArray(candidate.labels) &&
                    typeof candidate.column === 'string' &&
                    isKanbanColumnId(candidate.column) &&
                    typeof candidate.type === 'string' &&
                    isKanbanIssueType(candidate.type) &&
                    typeof candidate.priority === 'string' &&
                    isKanbanPriority(candidate.priority);
            })
                .map(issue => ({
                ...issue,
                labels: issue.labels.filter((label) => typeof label === 'string'),
                updatedAt: typeof issue.updatedAt === 'number' ? issue.updatedAt : Date.now(),
            }));
            if (!issues.length)
                return fallback;
            const sanitizedOrder = {
                backlog: [],
                selected: [],
                inprogress: [],
                done: [],
            };
            const knownIds = new Set(issues.map(issue => issue.id));
            const rawOrder = parsed.order;
            if (rawOrder && typeof rawOrder === 'object') {
                kanbanColumnIds.forEach(columnId => {
                    const orderList = rawOrder[columnId];
                    if (!Array.isArray(orderList))
                        return;
                    orderList.forEach(item => {
                        if (typeof item !== 'string' || !knownIds.has(item))
                            return;
                        if (!sanitizedOrder[columnId].includes(item)) {
                            sanitizedOrder[columnId].push(item);
                        }
                    });
                });
            }
            issues.forEach(issue => {
                if (!sanitizedOrder[issue.column].includes(issue.id)) {
                    sanitizedOrder[issue.column].push(issue.id);
                }
            });
            return {
                issues,
                order: sanitizedOrder,
                nextNumber: typeof parsed.nextNumber === 'number' && parsed.nextNumber > 108
                    ? parsed.nextNumber
                    : 109,
            };
        }
        catch {
            return fallback;
        }
    }
    function saveKanbanState() {
        try {
            window.localStorage.setItem(kanbanStorageKey, JSON.stringify(state));
        }
        catch {
            // ignore storage failures and keep the board usable in-memory
        }
    }
    function getIssue(issueId) {
        return state.issues.find(issue => issue.id === issueId);
    }
    function getAssigneeInitials(name) {
        const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() ?? '')
            .join('');
        return initials || 'LW';
    }
    function issueMatchesFilters(issue) {
        if (activeFilter !== 'all' && issue.type !== activeFilter)
            return false;
        if (!searchTerm)
            return true;
        const haystack = [
            issue.key,
            issue.summary,
            issue.description,
            issue.assignee,
            issue.labels.join(' '),
        ].join(' ').toLowerCase();
        return haystack.includes(searchTerm);
    }
    function priorityLabel(priority) {
        return priority === 'highest' ? 'highest'
            : priority === 'high' ? 'high'
                : priority === 'medium' ? 'medium'
                    : 'low';
    }
    function titleCase(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    function createEmptyState() {
        const empty = document.createElement('div');
        empty.className = 'kanban-empty';
        empty.textContent = searchTerm || activeFilter !== 'all'
            ? 'No issues match the current filters.'
            : 'No issues here yet.';
        return empty;
    }
    function openDialog() {
        if (!dialogEl.open)
            dialogEl.showModal();
    }
    function closeDialog() {
        if (dialogEl.open)
            dialogEl.close();
        formEl.reset();
        editingIssueId = null;
    }
    function openCreateIssue(columnId) {
        editingIssueId = null;
        dialogModeEl.textContent = 'Create issue';
        dialogTitleEl.textContent = 'New issue';
        saveButtonEl.textContent = 'Create issue';
        deleteButtonEl.hidden = true;
        summaryInputEl.value = '';
        descriptionInputEl.value = '';
        typeInputEl.value = 'task';
        priorityInputEl.value = 'medium';
        statusInputEl.value = columnId;
        assigneeInputEl.value = 'Liam';
        labelsInputEl.value = '';
        openDialog();
        summaryInputEl.focus();
    }
    function openEditIssue(issueId) {
        const issue = getIssue(issueId);
        if (!issue)
            return;
        editingIssueId = issue.id;
        dialogModeEl.textContent = issue.key;
        dialogTitleEl.textContent = 'Issue details';
        saveButtonEl.textContent = 'Save issue';
        deleteButtonEl.hidden = false;
        summaryInputEl.value = issue.summary;
        descriptionInputEl.value = issue.description;
        typeInputEl.value = issue.type;
        priorityInputEl.value = issue.priority;
        statusInputEl.value = issue.column;
        assigneeInputEl.value = issue.assignee;
        labelsInputEl.value = issue.labels.join(', ');
        openDialog();
        summaryInputEl.focus();
    }
    function removeIssue(issueId) {
        state.issues = state.issues.filter(issue => issue.id !== issueId);
        kanbanColumnIds.forEach(columnId => {
            state.order[columnId] = state.order[columnId].filter(id => id !== issueId);
        });
    }
    function moveIssue(issueId, targetColumn, beforeIssueId) {
        const issue = getIssue(issueId);
        if (!issue)
            return;
        kanbanColumnIds.forEach(columnId => {
            state.order[columnId] = state.order[columnId].filter(id => id !== issueId);
        });
        const targetOrder = state.order[targetColumn];
        const insertIndex = beforeIssueId ? targetOrder.indexOf(beforeIssueId) : -1;
        if (insertIndex >= 0) {
            targetOrder.splice(insertIndex, 0, issueId);
        }
        else {
            targetOrder.push(issueId);
        }
        issue.column = targetColumn;
        issue.updatedAt = Date.now();
        saveKanbanState();
        renderKanban();
    }
    function getDropBeforeIssueId(container, clientY) {
        const cards = Array.from(container.querySelectorAll('.kanban-ticket:not(.is-dragging)'));
        let closestOffset = Number.NEGATIVE_INFINITY;
        let closestId = null;
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const offset = clientY - rect.top - rect.height / 2;
            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closestId = card.dataset.issueId ?? null;
            }
        });
        return closestId;
    }
    function clearDragState() {
        Object.values(columnContainers).forEach(container => container.classList.remove('is-over'));
        document.querySelectorAll('.kanban-ticket.is-dragging').forEach(card => {
            card.classList.remove('is-dragging');
        });
    }
    function createIssueCard(issue) {
        const card = document.createElement('article');
        card.className = 'kanban-ticket';
        card.dataset.issueId = issue.id;
        card.draggable = true;
        card.tabIndex = 0;
        const top = document.createElement('div');
        top.className = 'kanban-ticket-top';
        const key = document.createElement('span');
        key.className = 'kanban-ticket-key';
        key.textContent = issue.key;
        const priority = document.createElement('span');
        priority.className = `kanban-priority kanban-priority-${issue.priority}`;
        priority.textContent = priorityLabel(issue.priority);
        top.append(key, priority);
        const summary = document.createElement('h3');
        summary.className = 'kanban-ticket-summary';
        summary.textContent = issue.summary;
        const description = document.createElement('p');
        description.className = 'kanban-ticket-description';
        description.textContent = issue.description;
        const labels = document.createElement('div');
        labels.className = 'kanban-ticket-labels';
        issue.labels.forEach(labelText => {
            const label = document.createElement('span');
            label.className = 'kanban-ticket-label';
            label.textContent = labelText;
            labels.appendChild(label);
        });
        const footer = document.createElement('div');
        footer.className = 'kanban-ticket-footer';
        const type = document.createElement('span');
        type.className = 'kanban-ticket-type';
        type.textContent = titleCase(issue.type);
        const assignee = document.createElement('span');
        assignee.className = 'kanban-ticket-assignee';
        const avatar = document.createElement('span');
        avatar.className = 'kanban-assignee-avatar';
        avatar.textContent = getAssigneeInitials(issue.assignee);
        const assigneeName = document.createElement('span');
        assigneeName.textContent = issue.assignee;
        assignee.append(avatar, assigneeName);
        footer.append(type, assignee);
        card.append(top, summary);
        if (issue.description.trim()) {
            card.appendChild(description);
        }
        if (issue.labels.length) {
            card.appendChild(labels);
        }
        card.appendChild(footer);
        card.addEventListener('click', () => openEditIssue(issue.id));
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openEditIssue(issue.id);
            }
        });
        card.addEventListener('dragstart', event => {
            draggedIssueId = issue.id;
            card.classList.add('is-dragging');
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', issue.id);
            }
        });
        card.addEventListener('dragend', () => {
            draggedIssueId = null;
            clearDragState();
        });
        return card;
    }
    function updateToolbarMeta() {
        const visibleCount = state.issues.filter(issue => issueMatchesFilters(issue)).length;
        const highPriorityCount = state.issues.filter(issue => issue.priority === 'high' || issue.priority === 'highest').length;
        toolbarMetaEl.textContent = `${visibleCount} visible · ${state.order.inprogress.length} active · ${highPriorityCount} high priority`;
    }
    function renderKanban() {
        const issueMap = new Map(state.issues.map(issue => [issue.id, issue]));
        kanbanColumnIds.forEach(columnId => {
            const container = columnContainers[columnId];
            const columnElement = columnElements[columnId];
            const allIds = state.order[columnId];
            const visibleIssues = allIds
                .map(issueId => issueMap.get(issueId))
                .filter((issue) => !!issue)
                .filter(issue => issueMatchesFilters(issue));
            container.innerHTML = '';
            if (visibleIssues.length) {
                visibleIssues.forEach(issue => {
                    container.appendChild(createIssueCard(issue));
                });
            }
            else {
                container.appendChild(createEmptyState());
            }
            const countText = (searchTerm || activeFilter !== 'all') && visibleIssues.length !== allIds.length
                ? `${visibleIssues.length}/${allIds.length}`
                : `${allIds.length}`;
            countElements[columnId].textContent = countText;
            columnElement.classList.toggle('is-over-limit', columnId === 'inprogress' && allIds.length > 3);
        });
        filterButtons.forEach(button => {
            if (!(button instanceof HTMLButtonElement))
                return;
            button.classList.toggle('is-active', button.dataset.filter === activeFilter);
        });
        updateToolbarMeta();
    }
    searchInputEl.addEventListener('input', () => {
        searchTerm = searchInputEl.value.trim().toLowerCase();
        renderKanban();
    });
    filterButtons.forEach(button => {
        if (!(button instanceof HTMLButtonElement))
            return;
        button.addEventListener('click', () => {
            const nextFilter = button.dataset.filter ?? 'all';
            if (nextFilter === 'all' || isKanbanIssueType(nextFilter)) {
                activeFilter = nextFilter;
                renderKanban();
            }
        });
    });
    addButtons.forEach(button => {
        if (!(button instanceof HTMLButtonElement))
            return;
        button.addEventListener('click', () => {
            const columnId = button.dataset.col ?? 'backlog';
            if (isKanbanColumnId(columnId)) {
                openCreateIssue(columnId);
            }
        });
    });
    kanbanColumnIds.forEach(columnId => {
        const container = columnContainers[columnId];
        container.addEventListener('dragover', event => {
            if (!draggedIssueId)
                return;
            event.preventDefault();
            container.classList.add('is-over');
            if (event.dataTransfer)
                event.dataTransfer.dropEffect = 'move';
        });
        container.addEventListener('dragleave', event => {
            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !container.contains(nextTarget)) {
                container.classList.remove('is-over');
            }
        });
        container.addEventListener('drop', event => {
            if (!draggedIssueId)
                return;
            event.preventDefault();
            const beforeIssueId = getDropBeforeIssueId(container, event.clientY);
            moveIssue(draggedIssueId, columnId, beforeIssueId);
            draggedIssueId = null;
            clearDragState();
        });
    });
    formEl.addEventListener('submit', event => {
        event.preventDefault();
        const summary = summaryInputEl.value.trim();
        const description = descriptionInputEl.value.trim();
        const type = typeInputEl.value;
        const priority = priorityInputEl.value;
        const column = statusInputEl.value;
        const assignee = assigneeInputEl.value.trim() || 'Liam';
        const labels = labelsInputEl.value
            .split(',')
            .map(label => label.trim().toLowerCase())
            .filter(Boolean);
        if (!summary || !isKanbanIssueType(type) || !isKanbanPriority(priority) || !isKanbanColumnId(column)) {
            return;
        }
        if (editingIssueId) {
            const issue = getIssue(editingIssueId);
            if (!issue)
                return;
            const previousColumn = issue.column;
            issue.summary = summary;
            issue.description = description;
            issue.type = type;
            issue.priority = priority;
            issue.assignee = assignee;
            issue.labels = labels;
            issue.updatedAt = Date.now();
            if (previousColumn !== column) {
                moveIssue(issue.id, column, null);
            }
            else {
                saveKanbanState();
                renderKanban();
            }
        }
        else {
            const issueId = `issue-${state.nextNumber}`;
            const issue = {
                id: issueId,
                key: `LW-${state.nextNumber}`,
                summary,
                description,
                type,
                priority,
                assignee,
                labels,
                column,
                updatedAt: Date.now(),
            };
            state.nextNumber += 1;
            state.issues.unshift(issue);
            state.order[column].unshift(issue.id);
            saveKanbanState();
            renderKanban();
        }
        closeDialog();
    });
    deleteButtonEl.addEventListener('click', () => {
        if (!editingIssueId)
            return;
        removeIssue(editingIssueId);
        saveKanbanState();
        renderKanban();
        closeDialog();
    });
    closeButtonEl.addEventListener('click', closeDialog);
    cancelButtonEl.addEventListener('click', closeDialog);
    resetButtonEl.addEventListener('click', () => {
        state = createDefaultKanbanState();
        activeFilter = 'all';
        searchTerm = '';
        searchInputEl.value = '';
        saveKanbanState();
        renderKanban();
    });
    renderKanban();
}
function setupGraph() {
    const canvas = document.getElementById('graph-canvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    let W = 0;
    let H = 0;
    const menuAngles = sectionIds.reduce((angles, sectionId, index) => {
        angles[sectionId] = -Math.PI / 2 + (Math.PI * 2 * index / sectionIds.length);
        return angles;
    }, {});
    const raw = [
        { id: 'me', label: 'Liam', type: 'core', r: 18, description: 'center node for the site map' },
        { id: 'work', label: 'Experience', type: 'menu', r: 11, sectionId: 'work', description: 'roles across security, systems, and automation' },
        { id: 'projects', label: 'Archive', type: 'menu', r: 11, sectionId: 'projects', description: 'product builds, C++ projects, and repo experiments' },
        { id: 'about', label: 'About', type: 'menu', r: 11, sectionId: 'about', description: 'work style, side interests, and what I am focused on' },
        { id: 'uses', label: 'Toolbox', type: 'menu', r: 11, sectionId: 'uses', description: 'daily stack, workflow tools, configs, and habits' },
        { id: 'library', label: "What I've Read", type: 'menu', r: 11, sectionId: 'library', description: 'a minimal shelf of self-help, philosophy, and coding books' },
        { id: 'travel', label: 'Travel', type: 'menu', r: 11, sectionId: 'travel', description: 'a monochrome map of the countries I have visited so far' },
        { id: 'keyboards', label: 'Boards', type: 'menu', r: 11, sectionId: 'keyboards', description: 'split layouts, firmware, and keyboard tinkering' },
        { id: 'board', label: 'Kanban', type: 'menu', r: 11, sectionId: 'board', description: 'a personal Jira-style workflow with seeded issues' },
        { id: 'msab', label: 'MSAB', type: 'detail', r: 5, sectionId: 'work', description: 'current role in digital forensics and security software' },
        { id: 'automation', label: 'automation', type: 'detail', r: 4, sectionId: 'work', description: 'scripts, workflows, and process cleanup across roles' },
        { id: 'linker', label: 'Linker', type: 'detail', r: 5, sectionId: 'projects', description: 'full-stack link platform with analytics and QR tools' },
        { id: 'parsercpp', label: 'parsercpp', type: 'detail', r: 4, sectionId: 'projects', description: 'lower-level parsing and C++ exploration' },
        { id: 'focus', label: 'focus', type: 'detail', r: 4, sectionId: 'about', description: 'what I am leaning into right now on the systems side' },
        { id: 'tinkering', label: 'tinkering', type: 'detail', r: 4, sectionId: 'about', description: 'side projects, keyboards, and small experiments outside work' },
        { id: 'vscode', label: 'VS Code', type: 'detail', r: 4, sectionId: 'uses', description: 'editor config, repo hygiene, and day-to-day coding flow' },
        { id: 'dotfiles', label: 'dotfiles', type: 'detail', r: 4, sectionId: 'uses', description: 'editor, shell, and environment tweaks that shape the daily workflow' },
        { id: 'coding', label: 'coding', type: 'detail', r: 4, sectionId: 'library', description: 'engineering and systems books that sharpen the way I build' },
        { id: 'philosophy', label: 'philosophy', type: 'detail', r: 4, sectionId: 'library', description: 'self-development and philosophy books that shape focus and perspective' },
        { id: 'regions', label: 'regions', type: 'detail', r: 4, sectionId: 'travel', description: 'Europe, Asia, Africa, and North America / Caribbean so far' },
        { id: 'routes', label: 'routes', type: 'detail', r: 4, sectionId: 'travel', description: 'a mix of city trips, beach destinations, and longer Asia travel' },
        { id: 'lily58', label: 'Lily58', type: 'detail', r: 4, sectionId: 'keyboards', description: 'split keyboard setup and config tinkering' },
        { id: 'zmk', label: 'ZMK', type: 'detail', r: 4, sectionId: 'keyboards', description: 'firmware, layers, and keymap experimentation' },
        { id: 'issues', label: 'issues', type: 'detail', r: 4, sectionId: 'board', description: 'seeded tasks, priorities, and a personal backlog' },
        { id: 'workflow', label: 'workflow', type: 'detail', r: 4, sectionId: 'board', description: 'ranked work moving from backlog to done' },
        { id: 'notes', label: 'Notes', type: 'menu', r: 11, sectionId: 'notes', description: 'short observations and things I figured out or wanted to write down' },
        { id: 'game', label: 'Game', type: 'menu', r: 11, sectionId: 'game', description: 'a playable snake game — arrow keys or WASD' },
        { id: 'observations', label: 'observations', type: 'detail', r: 4, sectionId: 'notes', description: 'workflow, systems, and linux notes' },
        { id: 'snake', label: 'snake', type: 'detail', r: 4, sectionId: 'game', description: 'canvas game with local highscore tracking' },
    ];
    const edges = [
        { source: 'me', target: 'work' },
        { source: 'me', target: 'projects' },
        { source: 'me', target: 'about' },
        { source: 'me', target: 'uses' },
        { source: 'me', target: 'library' },
        { source: 'me', target: 'travel' },
        { source: 'me', target: 'keyboards' },
        { source: 'me', target: 'board' },
        { source: 'work', target: 'msab' },
        { source: 'work', target: 'automation' },
        { source: 'projects', target: 'linker' },
        { source: 'projects', target: 'parsercpp' },
        { source: 'about', target: 'focus' },
        { source: 'about', target: 'tinkering' },
        { source: 'uses', target: 'vscode' },
        { source: 'uses', target: 'dotfiles' },
        { source: 'library', target: 'coding' },
        { source: 'library', target: 'philosophy' },
        { source: 'travel', target: 'regions' },
        { source: 'travel', target: 'routes' },
        { source: 'keyboards', target: 'lily58' },
        { source: 'keyboards', target: 'zmk' },
        { source: 'board', target: 'issues' },
        { source: 'board', target: 'workflow' },
        { source: 'me', target: 'notes' },
        { source: 'me', target: 'game' },
        { source: 'notes', target: 'observations' },
        { source: 'game', target: 'snake' },
    ];
    const nodes = raw.map(n => ({
        ...n,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 0,
        targetY: 0,
    }));
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));
    let hoveredNode = null;
    let mx = -9999, my = -9999;
    let animationTick = 0;
    const status = document.getElementById('graph-status');
    function resizeCanvas() {
        W = canvas.offsetWidth || 800;
        H = canvas.offsetHeight || 560;
        canvas.width = W;
        canvas.height = H;
        updateTargets();
    }
    function setNodeTarget(id, x, y) {
        const node = nodeMap.get(id);
        if (!node)
            return;
        node.targetX = x;
        node.targetY = y;
        if (node.x === 0 && node.y === 0) {
            node.x = x;
            node.y = y;
        }
    }
    function updateTargets() {
        const cx = W / 2;
        const cy = H / 2;
        const orbit = Math.min(W, H) * 0.205;
        const detailOrbit = orbit + 46;
        const detailLayout = [
            { id: 'msab', parent: 'work', angleOffset: -0.26, distanceBias: 8 },
            { id: 'automation', parent: 'work', angleOffset: 0.24, distanceBias: -4 },
            { id: 'linker', parent: 'projects', angleOffset: -0.26, distanceBias: 6 },
            { id: 'parsercpp', parent: 'projects', angleOffset: 0.28, distanceBias: -2 },
            { id: 'focus', parent: 'about', angleOffset: -0.28, distanceBias: 6 },
            { id: 'tinkering', parent: 'about', angleOffset: 0.24, distanceBias: -2 },
            { id: 'vscode', parent: 'uses', angleOffset: -0.24, distanceBias: 4 },
            { id: 'dotfiles', parent: 'uses', angleOffset: 0.28, distanceBias: -2 },
            { id: 'coding', parent: 'library', angleOffset: -0.26, distanceBias: 6 },
            { id: 'philosophy', parent: 'library', angleOffset: 0.24, distanceBias: -2 },
            { id: 'regions', parent: 'travel', angleOffset: -0.24, distanceBias: 6 },
            { id: 'routes', parent: 'travel', angleOffset: 0.28, distanceBias: -2 },
            { id: 'lily58', parent: 'keyboards', angleOffset: -0.24, distanceBias: 6 },
            { id: 'zmk', parent: 'keyboards', angleOffset: 0.28, distanceBias: -2 },
            { id: 'issues', parent: 'board', angleOffset: -0.24, distanceBias: 6 },
            { id: 'workflow', parent: 'board', angleOffset: 0.28, distanceBias: -4 },
            { id: 'observations', parent: 'notes', angleOffset: -0.26, distanceBias: 6 },
            { id: 'snake', parent: 'game', angleOffset: 0.26, distanceBias: -2 },
        ];
        setNodeTarget('me', cx, cy);
        sectionIds.forEach(sectionId => {
            const angle = menuAngles[sectionId];
            const x = cx + Math.cos(angle) * orbit;
            const y = cy + Math.sin(angle) * orbit;
            setNodeTarget(sectionId, x, y);
        });
        detailLayout.forEach(detail => {
            const angle = menuAngles[detail.parent] + detail.angleOffset;
            const distance = detailOrbit + detail.distanceBias;
            const x = cx + Math.cos(angle) * distance;
            const y = cy + Math.sin(angle) * distance;
            setNodeTarget(detail.id, x, y);
        });
    }
    function tick() {
        animationTick += 0.006;
        nodes.forEach((n, index) => {
            const wobbleStrength = n.type === 'detail' ? 0.9 : n.type === 'menu' ? 0.35 : 0.18;
            const wobbleX = Math.sin(animationTick + index * 0.9) * wobbleStrength;
            const wobbleY = Math.cos(animationTick * 1.1 + index * 0.7) * wobbleStrength;
            const targetX = n.targetX + wobbleX;
            const targetY = n.targetY + wobbleY;
            n.vx = (n.vx + (targetX - n.x) * 0.038) * 0.78;
            n.vy = (n.vy + (targetY - n.y) * 0.038) * 0.78;
            n.x += n.vx;
            n.y += n.vy;
        });
    }
    function connectedToHovered(n) {
        const hovered = hoveredNode;
        if (!hovered)
            return false;
        return edges.some(e => (e.source === hovered.id && e.target === n.id) ||
            (e.target === hovered.id && e.source === n.id));
    }
    function edgeTouchesSection(edge, sectionId) {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        return source?.sectionId === sectionId || target?.sectionId === sectionId;
    }
    function sectionLabel(sectionId) {
        return sectionId === 'work' ? 'Experience'
            : sectionId === 'projects' ? 'Project Archive'
                : sectionId === 'about' ? 'About Me'
                    : sectionId === 'uses' ? 'Toolbox / Uses'
                        : sectionId === 'library' ? "What I've Read"
                            : sectionId === 'travel' ? 'Travel Map'
                                : sectionId === 'keyboards' ? 'Keyboards'
                                    : sectionId === 'notes' ? 'Notes'
                                        : sectionId === 'game' ? 'Game'
                                            : 'Kanban Board';
    }
    function nodeFill(n, isHovered, isConnected, isActive) {
        if (n.type === 'core')
            return '#EEEEEE';
        if (isHovered)
            return '#F6F6F6';
        if (isActive)
            return '#CFCFCF';
        if (isConnected)
            return '#9A9A9A';
        return n.type === 'menu' ? '#5C5C5C' : '#2E2E2E';
    }
    function graphStatusText(node) {
        if (!node) {
            return `current focus: ${sectionLabel(currentSection)} · hover a node to explore`;
        }
        if (node.id === 'me') {
            return 'center node for the site map · hover a branch to preview that part of the page';
        }
        const parts = [node.label];
        if (node.description)
            parts.push(node.description);
        if (node.sectionId)
            parts.push(`click to jump to ${sectionLabel(node.sectionId)}`);
        return parts.join(' · ');
    }
    function render() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(0, 0, W, H);
        const hovered = nodes.find(n => {
            const dx = mx - n.x, dy = my - n.y;
            return Math.sqrt(dx * dx + dy * dy) < n.r + 12;
        }) ?? null;
        hoveredNode = hovered;
        edges.forEach(e => {
            const a = nodeMap.get(e.source), b = nodeMap.get(e.target);
            const lit = hovered ? (e.source === hovered.id || e.target === hovered.id) : false;
            const active = edgeTouchesSection(e, currentSection);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = lit ? 'rgba(238,238,238,0.6)'
                : active ? 'rgba(170,170,170,0.34)'
                    : 'rgba(42,42,42,0.95)';
            ctx.lineWidth = lit ? 1.5 : active ? 1 : 0.65;
            ctx.stroke();
        });
        nodes.forEach(n => {
            const hov = n === hoveredNode;
            const conn = connectedToHovered(n);
            const active = n.sectionId === currentSection;
            const faded = !!hoveredNode && !hov && !conn && n.id !== 'me';
            const fill = faded ? '#1A1A1A' : nodeFill(n, hov, conn, active);
            if (active || hov) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r + (hov ? 8 : 7), 0, Math.PI * 2);
                ctx.strokeStyle = hov ? 'rgba(238,238,238,0.34)' : 'rgba(238,238,238,0.25)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
            const showLabel = n.type !== 'detail' || hov || conn || active;
            if (showLabel && !faded) {
                ctx.fillStyle = hov ? '#EEEEEE'
                    : active ? '#D2D2D2'
                        : conn ? '#AAAAAA'
                            : n.type === 'core' ? '#EEEEEE'
                                : '#666666';
                const fontSize = n.type === 'core' ? 12 : n.type === 'menu' ? 11 : 9;
                ctx.font = `${hov || active ? '500 ' : ''}${fontSize}px "IBM Plex Mono"`;
                ctx.textAlign = 'center';
                ctx.fillText(n.label, n.x, n.y - n.r - 8);
            }
        });
        const hoveredCanNavigate = !!(hoveredNode && hoveredNode.sectionId);
        canvas.style.cursor = hoveredCanNavigate ? 'pointer' : 'default';
        if (status) {
            status.textContent = graphStatusText(hovered);
        }
    }
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mx = (e.clientX - rect.left) * (W / rect.width);
        my = (e.clientY - rect.top) * (H / rect.height);
    });
    canvas.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });
    canvas.addEventListener('click', () => {
        const hovered = hoveredNode;
        if (hovered && hovered.sectionId) {
            scrollToSection(hovered.sectionId);
        }
    });
    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible)
            return;
        const sectionId = visible.target.id;
        if (sectionIds.includes(sectionId)) {
            currentSection = sectionId;
            if (window.location.hash !== `#${sectionId}`) {
                window.history.replaceState(null, '', `#${sectionId}`);
            }
        }
    }, {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.55],
    });
    sectionIds.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section)
            observer.observe(section);
    });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    function loop() { tick(); render(); requestAnimationFrame(loop); }
    loop();
}
const NOTES_KEY = 'portfolio-notes-v1';
const defaultNotes = [
    { id: 'note-1', date: 'Apr 2026', tag: 'workflow', body: 'Reading code only gets me so far. I usually understand a codebase faster once I break something and have to follow the fallout.' },
    { id: 'note-2', date: 'Mar 2026', tag: 'systems', body: 'C++ has a way of making vague thinking obvious. If you do not understand ownership, the code tells you pretty quickly.' },
    { id: 'note-3', date: 'Mar 2026', tag: 'tools', body: 'n8n is way more useful than people give it credit for. Good for getting internal automation off the ground without turning everything into a huge project.' },
    { id: 'note-4', date: 'Feb 2026', tag: 'keyboards', body: 'Split keyboards feel wrong until they do not. Then going back starts feeling wrong instead.' },
    { id: 'note-5', date: 'Jan 2026', tag: 'general', body: 'A lot of bugs come from assumptions that felt harmless at the time. Usually the annoying fix is the real fix.' },
    { id: 'note-6', date: 'Dec 2025', tag: 'linux', body: 'Dual booting only makes sense if you actually use both sides. If one OS wins every time, just admit it and commit.' },
];
function setupNotes() {
    const listEl = document.getElementById('notes-list');
    const dialogEl = document.getElementById('note-dialog');
    const dateEl = document.getElementById('note-dialog-date');
    const tagEl = document.getElementById('note-dialog-tag');
    const bodyEl = document.getElementById('note-dialog-body');
    const doneBtn = document.getElementById('note-dialog-done');
    if (!(listEl instanceof HTMLElement) ||
        !(dialogEl instanceof HTMLDialogElement) ||
        !(dateEl instanceof HTMLElement) ||
        !(tagEl instanceof HTMLElement) ||
        !(bodyEl instanceof HTMLTextAreaElement) ||
        !(doneBtn instanceof HTMLButtonElement))
        return;
    const list = listEl;
    const dialog = dialogEl;
    const dateSpan = dateEl;
    const tagSpan = tagEl;
    const bodyArea = bodyEl;
    const done = doneBtn;
    let notes = (() => {
        try {
            const raw = localStorage.getItem(NOTES_KEY);
            if (!raw)
                return [...defaultNotes];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || !parsed.length)
                return [...defaultNotes];
            return parsed;
        }
        catch {
            return [...defaultNotes];
        }
    })();
    let editingId = null;
    function saveNotes() {
        try {
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        }
        catch { /* ignore */ }
    }
    function renderNotes() {
        list.innerHTML = '';
        notes.forEach(note => {
            const article = document.createElement('article');
            article.className = 'note-entry note-entry-clickable';
            article.setAttribute('role', 'button');
            article.setAttribute('tabindex', '0');
            article.innerHTML = `
                <div class="note-meta">
                    <span class="note-date">${note.date}</span>
                    <span class="note-tag">${note.tag}</span>
                </div>
                <p class="note-body">${note.body}</p>
            `;
            article.addEventListener('click', () => openNote(note.id));
            article.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openNote(note.id);
                }
            });
            list.appendChild(article);
        });
    }
    function openNote(id) {
        const note = notes.find(n => n.id === id);
        if (!note)
            return;
        editingId = id;
        dateSpan.textContent = note.date;
        tagSpan.textContent = note.tag;
        bodyArea.value = note.body;
        dialog.showModal();
        bodyArea.focus();
    }
    function closeNote() {
        if (editingId) {
            const note = notes.find(n => n.id === editingId);
            if (note) {
                const updated = bodyArea.value.trim();
                if (updated)
                    note.body = updated;
                saveNotes();
                renderNotes();
            }
        }
        editingId = null;
        dialog.close();
    }
    done.addEventListener('click', closeNote);
    dialog.addEventListener('click', e => { if (e.target === dialog)
        closeNote(); });
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeNote(); });
    renderNotes();
}
function setupSnakeGame() {
    const canvas = document.getElementById('snake-canvas');
    const scoreEl = document.getElementById('snake-score');
    const bestEl = document.getElementById('snake-best');
    const startBtn = document.getElementById('snake-start');
    const statusEl = document.getElementById('snake-status');
    if (!(canvas instanceof HTMLCanvasElement) ||
        !(scoreEl instanceof HTMLElement) ||
        !(bestEl instanceof HTMLElement) ||
        !(startBtn instanceof HTMLButtonElement) ||
        !(statusEl instanceof HTMLElement))
        return;
    // Typed aliases so closures don't lose narrowing
    const cv = canvas;
    const se = scoreEl;
    const be = bestEl;
    const sb = startBtn;
    const st = statusEl;
    const ctx = canvas.getContext('2d');
    const CELL = 18;
    const COLS = 28;
    const ROWS = 22;
    cv.width = COLS * CELL;
    cv.height = ROWS * CELL;
    let snake = [];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };
    let score = 0;
    let best = parseInt(localStorage.getItem('snake-best') ?? '0', 10);
    let running = false;
    let isOver = false;
    let loopId = 0;
    be.textContent = String(best);
    function randomFood() {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        } while (snake.some(s => s.x === pos.x && s.y === pos.y));
        food = pos;
    }
    function startGame() {
        clearTimeout(loopId);
        snake = [{ x: 14, y: 11 }, { x: 13, y: 11 }, { x: 12, y: 11 }];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        se.textContent = '0';
        isOver = false;
        running = true;
        st.textContent = '';
        sb.textContent = 'restart';
        randomFood();
        loop();
    }
    function endGame() {
        running = false;
        isOver = true;
        clearTimeout(loopId);
        if (score > best) {
            best = score;
            be.textContent = String(best);
            localStorage.setItem('snake-best', String(best));
            st.textContent = 'new best!';
        }
        else {
            st.textContent = 'game over';
        }
        sb.textContent = 'play again';
        draw();
    }
    function step() {
        dir = { ...nextDir };
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            endGame();
            return;
        }
        if (snake.some(s => s.x === head.x && s.y === head.y)) {
            endGame();
            return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            se.textContent = String(score);
            randomFood();
        }
        else {
            snake.pop();
        }
    }
    function draw() {
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL, 0);
            ctx.lineTo(x * CELL, cv.height);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL);
            ctx.lineTo(cv.width, y * CELL);
            ctx.stroke();
        }
        ctx.fillStyle = '#AAAAAA';
        ctx.beginPath();
        ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        snake.forEach((seg, i) => {
            const t = Math.min(1, i / Math.max(1, snake.length - 1));
            const brightness = Math.round(220 - t * 170);
            ctx.fillStyle = i === 0 ? '#EEEEEE' : `rgb(${brightness},${brightness},${brightness})`;
            const p = i === 0 ? 1 : 2;
            ctx.fillRect(seg.x * CELL + p, seg.y * CELL + p, CELL - p * 2, CELL - p * 2);
        });
        if (isOver) {
            ctx.fillStyle = 'rgba(8,8,8,0.82)';
            ctx.fillRect(0, 0, cv.width, cv.height);
            ctx.fillStyle = '#EEEEEE';
            ctx.font = '500 13px "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('game over', cv.width / 2, cv.height / 2 - 8);
            ctx.fillStyle = '#5A5A5A';
            ctx.font = '11px "IBM Plex Mono", monospace';
            ctx.fillText(`score: ${score}`, cv.width / 2, cv.height / 2 + 10);
        }
        if (!running && !isOver) {
            ctx.fillStyle = 'rgba(15,15,15,0.6)';
            ctx.fillRect(0, 0, cv.width, cv.height);
            ctx.fillStyle = '#2E2E2E';
            ctx.font = '11px "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('press start to play', cv.width / 2, cv.height / 2);
        }
    }
    function loop() {
        if (!running)
            return;
        step();
        if (!running)
            return;
        draw();
        const speed = Math.max(60, 150 - score * 4);
        loopId = window.setTimeout(loop, speed);
    }
    window.addEventListener('keydown', e => {
        if (!running)
            return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))
            e.preventDefault();
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (dir.y !== 1)
                    nextDir = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (dir.y !== -1)
                    nextDir = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (dir.x !== 1)
                    nextDir = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (dir.x !== -1)
                    nextDir = { x: 1, y: 0 };
                break;
        }
    }, { passive: false });
    sb.addEventListener('click', startGame);
    draw();
}
// init everything when page loads
function setupScrollProgress() {
    const nav = document.getElementById('section-progress');
    if (!nav)
        return;
    const labels = {
        work: 'work', projects: 'projects', about: 'about', uses: 'uses',
        library: 'library', travel: 'travel', keyboards: 'keyboards',
        board: 'board', notes: 'notes', game: 'game'
    };
    // build bars
    const bars = new Map();
    sectionIds.forEach(id => {
        const bar = document.createElement('span');
        bar.className = 'sp-bar';
        bar.dataset.section = id;
        const label = document.createElement('span');
        label.className = 'sp-label';
        label.textContent = labels[id];
        bar.appendChild(label);
        bar.addEventListener('click', () => scrollToSection(id));
        nav.appendChild(bar);
        bars.set(id, bar);
    });
    const update = () => {
        const scrollMid = window.scrollY + window.innerHeight * 0.5;
        let activeId = null;
        // find which section the midpoint is inside
        for (let i = sectionIds.length - 1; i >= 0; i--) {
            const el = document.getElementById(sectionIds[i]);
            if (el && el.offsetTop <= scrollMid) {
                activeId = sectionIds[i];
                break;
            }
        }
        sectionIds.forEach((id, idx) => {
            const bar = bars.get(id);
            if (!bar)
                return;
            const activeIdx = activeId ? sectionIds.indexOf(activeId) : -1;
            bar.classList.remove('sp-active', 'sp-past');
            if (id === activeId) {
                bar.classList.add('sp-active');
            }
            else if (idx < activeIdx) {
                bar.classList.add('sp-past');
            }
        });
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
}
document.addEventListener('DOMContentLoaded', () => {
    setupHashNavigation();
    setupCursorFx();
    setupEmailCopy();
    void setupDynamicIntro();
    setupProjectArchiveTabs();
    setupKanban();
    setupActivityChart();
    setupWeeklyGrid();
    setupTravelMap();
    setupGraph();
    setupNotes();
    setupSnakeGame();
    setupScrollProgress();
    console.log('site loaded!');
});
//# sourceMappingURL=app.js.map