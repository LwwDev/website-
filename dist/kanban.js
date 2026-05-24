"use strict";
var PrivateKanbanPage;
(function (PrivateKanbanPage) {
    const SUPABASE_URL = 'https://tcgpjwzviqdhbtjsohlq.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_2lsTFLaVGNdUXczWZ_Mw0w_5UCF9KHZ';
    const KANBAN_TABLE = 'kanban_boards';
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
                id: 'private-issue-101',
                key: 'LW-101',
                summary: 'Set up Supabase auth for the private board',
                description: 'Keep the public board open on the main site and route the real board through /kanban.',
                type: 'story',
                priority: 'highest',
                assignee: 'Liam',
                labels: ['supabase', 'auth'],
                column: 'selected',
                updatedAt: now - 1000 * 60 * 35,
            },
            {
                id: 'private-issue-102',
                key: 'LW-102',
                summary: 'Add a clean private route for the hidden board',
                description: 'Make /kanban feel intentional instead of like a leftover admin screen.',
                type: 'task',
                priority: 'high',
                assignee: 'Liam',
                labels: ['routing', 'vercel'],
                column: 'inprogress',
                updatedAt: now - 1000 * 60 * 18,
            },
            {
                id: 'private-issue-103',
                key: 'LW-103',
                summary: 'Keep the homepage board as a public demo',
                description: 'The public board should stay playful and visible without any login friction.',
                type: 'story',
                priority: 'medium',
                assignee: 'Liam',
                labels: ['public', 'demo'],
                column: 'backlog',
                updatedAt: now - 1000 * 60 * 65,
            },
            {
                id: 'private-issue-104',
                key: 'LW-104',
                summary: 'Capture smaller personal tasks privately',
                description: 'Use the private board for the messier real-life and work-in-progress stuff.',
                type: 'task',
                priority: 'medium',
                assignee: 'Liam',
                labels: ['personal'],
                column: 'backlog',
                updatedAt: now - 1000 * 60 * 80,
            },
            {
                id: 'private-issue-105',
                key: 'LW-105',
                summary: 'Polish the login view',
                description: 'Make the gate feel understated and consistent with the rest of the site.',
                type: 'task',
                priority: 'low',
                assignee: 'Liam',
                labels: ['ui'],
                column: 'done',
                updatedAt: now - 1000 * 60 * 180,
            },
        ];
        return {
            issues,
            order: {
                backlog: ['private-issue-103', 'private-issue-104'],
                selected: ['private-issue-101'],
                inprogress: ['private-issue-102'],
                done: ['private-issue-105'],
            },
            nextNumber: 106,
        };
    }
    function cloneState(state) {
        return JSON.parse(JSON.stringify(state));
    }
    function sanitizeBoardState(candidate) {
        const fallback = createDefaultKanbanState();
        if (!candidate || typeof candidate !== 'object')
            return fallback;
        const parsed = candidate;
        if (!Array.isArray(parsed.issues))
            return fallback;
        const issues = parsed.issues
            .filter((issue) => {
            if (!issue || typeof issue !== 'object')
                return false;
            const candidateIssue = issue;
            return typeof candidateIssue.id === 'string' &&
                typeof candidateIssue.key === 'string' &&
                typeof candidateIssue.summary === 'string' &&
                typeof candidateIssue.description === 'string' &&
                typeof candidateIssue.assignee === 'string' &&
                Array.isArray(candidateIssue.labels) &&
                typeof candidateIssue.column === 'string' &&
                isKanbanColumnId(candidateIssue.column) &&
                typeof candidateIssue.type === 'string' &&
                isKanbanIssueType(candidateIssue.type) &&
                typeof candidateIssue.priority === 'string' &&
                isKanbanPriority(candidateIssue.priority);
        })
            .map(issue => ({
            ...issue,
            labels: issue.labels.filter((label) => typeof label === 'string'),
            updatedAt: typeof issue.updatedAt === 'number' ? issue.updatedAt : Date.now(),
        }));
        if (!issues.length)
            return fallback;
        const knownIds = new Set(issues.map(issue => issue.id));
        const sanitizedOrder = {
            backlog: [],
            selected: [],
            inprogress: [],
            done: [],
        };
        if (parsed.order && typeof parsed.order === 'object') {
            kanbanColumnIds.forEach(columnId => {
                const rawColumn = parsed.order[columnId];
                if (!Array.isArray(rawColumn))
                    return;
                rawColumn.forEach(item => {
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
            nextNumber: typeof parsed.nextNumber === 'number' && parsed.nextNumber > 100
                ? parsed.nextNumber
                : 106,
        };
    }
    function createSupabaseClient() {
        const win = window;
        if (!win.supabase) {
            throw new Error('Supabase client could not be loaded.');
        }
        return win.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    function setText(element, value) {
        if (element)
            element.textContent = value;
    }
    function setHidden(element, hidden) {
        if (element)
            element.classList.toggle('hidden', hidden);
    }
    function createPrivateBoard(client, userId) {
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
        const syncStatus = document.getElementById('private-sync-status');
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
            return null;
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
        let state = createDefaultKanbanState();
        let activeFilter = 'all';
        let searchTerm = '';
        let draggedIssueId = null;
        let editingIssueId = null;
        let saveInFlight = false;
        let pendingSave = false;
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
        function updateSyncStatus(message) {
            setText(syncStatus instanceof HTMLElement ? syncStatus : null, message);
        }
        async function saveBoardState() {
            if (saveInFlight) {
                pendingSave = true;
                return;
            }
            saveInFlight = true;
            updateSyncStatus('Saving…');
            do {
                pendingSave = false;
                const payload = cloneState(state);
                const { error } = await client
                    .from(KANBAN_TABLE)
                    .upsert({
                    user_id: userId,
                    board_state: payload,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
                if (error) {
                    updateSyncStatus('Save failed');
                    saveInFlight = false;
                    return;
                }
            } while (pendingSave);
            saveInFlight = false;
            updateSyncStatus('Synced');
        }
        function requestSave() {
            void saveBoardState();
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
            requestSave();
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
                button.classList.toggle('is-active', button.dataset.filter === activeFilter);
            });
            updateToolbarMeta();
        }
        searchInputEl.addEventListener('input', () => {
            searchTerm = searchInputEl.value.trim().toLowerCase();
            renderKanban();
        });
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const nextFilter = button.dataset.filter ?? 'all';
                if (nextFilter === 'all' || isKanbanIssueType(nextFilter)) {
                    activeFilter = nextFilter;
                    renderKanban();
                }
            });
        });
        addButtons.forEach(button => {
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
                    requestSave();
                    renderKanban();
                }
            }
            else {
                const issueId = `private-issue-${state.nextNumber}`;
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
                requestSave();
                renderKanban();
            }
            closeDialog();
        });
        deleteButtonEl.addEventListener('click', () => {
            if (!editingIssueId)
                return;
            removeIssue(editingIssueId);
            requestSave();
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
            requestSave();
            renderKanban();
        });
        return {
            render: renderKanban,
            setState: (nextState) => {
                state = sanitizeBoardState(nextState);
                renderKanban();
            },
        };
    }
    async function bootstrap() {
        const loginShell = document.getElementById('private-login-shell');
        const boardShell = document.getElementById('private-board-shell');
        const loginForm = document.getElementById('private-login-form');
        const emailInput = document.getElementById('private-email-input');
        const passwordInput = document.getElementById('private-password-input');
        const errorEl = document.getElementById('private-login-error');
        const submitButton = document.getElementById('private-login-submit');
        const logoutButton = document.getElementById('private-logout-btn');
        const routeStatus = document.getElementById('private-route-status');
        const userEmail = document.getElementById('private-user-email');
        if (!(loginShell instanceof HTMLElement) ||
            !(boardShell instanceof HTMLElement) ||
            !(loginForm instanceof HTMLFormElement) ||
            !(emailInput instanceof HTMLInputElement) ||
            !(passwordInput instanceof HTMLInputElement) ||
            !(submitButton instanceof HTMLButtonElement) ||
            !(logoutButton instanceof HTMLButtonElement)) {
            return;
        }
        let client;
        try {
            client = createSupabaseClient();
        }
        catch (error) {
            setText(routeStatus instanceof HTMLElement ? routeStatus : null, error instanceof Error ? error.message : 'Supabase failed to load.');
            return;
        }
        let boardUi = null;
        async function loadRemoteBoard(userId) {
            const { data, error } = await client
                .from(KANBAN_TABLE)
                .select('board_state')
                .eq('user_id', userId)
                .maybeSingle();
            if (error) {
                throw error;
            }
            if (!data || !data.board_state) {
                const seeded = createDefaultKanbanState();
                const { error: saveError } = await client
                    .from(KANBAN_TABLE)
                    .upsert({
                    user_id: userId,
                    board_state: seeded,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
                if (saveError)
                    throw saveError;
                return seeded;
            }
            return sanitizeBoardState(data.board_state);
        }
        async function showSession(session) {
            const isLoggedIn = !!session?.user;
            setHidden(loginShell, isLoggedIn);
            setHidden(boardShell, !isLoggedIn);
            if (errorEl instanceof HTMLElement) {
                errorEl.classList.add('hidden');
                errorEl.textContent = '';
            }
            if (!isLoggedIn) {
                setText(routeStatus instanceof HTMLElement ? routeStatus : null, 'Private route ready');
                return;
            }
            const email = typeof session.user.email === 'string' ? session.user.email : 'signed in';
            setText(userEmail instanceof HTMLElement ? userEmail : null, email);
            setText(routeStatus instanceof HTMLElement ? routeStatus : null, 'Private board active');
            if (!boardUi) {
                boardUi = createPrivateBoard(client, session.user.id);
                if (!boardUi) {
                    throw new Error('Private board UI could not be initialized.');
                }
            }
            const remoteState = await loadRemoteBoard(session.user.id);
            boardUi.setState(remoteState);
        }
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            submitButton.disabled = true;
            setText(routeStatus instanceof HTMLElement ? routeStatus : null, 'Signing in…');
            const { error } = await client.auth.signInWithPassword({
                email: emailInput.value.trim(),
                password: passwordInput.value,
            });
            submitButton.disabled = false;
            if (error) {
                if (errorEl instanceof HTMLElement) {
                    errorEl.textContent = error.message;
                    errorEl.classList.remove('hidden');
                }
                setText(routeStatus instanceof HTMLElement ? routeStatus : null, 'Login failed');
            }
        });
        logoutButton.addEventListener('click', async () => {
            await client.auth.signOut();
            setText(routeStatus instanceof HTMLElement ? routeStatus : null, 'Signed out');
        });
        client.auth.onAuthStateChange((_event, session) => {
            void showSession(session);
        });
        const { data, error } = await client.auth.getSession();
        if (error) {
            if (errorEl instanceof HTMLElement) {
                errorEl.textContent = error.message;
                errorEl.classList.remove('hidden');
            }
            return;
        }
        await showSession(data.session);
    }
    document.addEventListener('DOMContentLoaded', () => {
        void bootstrap();
    });
})(PrivateKanbanPage || (PrivateKanbanPage = {}));
//# sourceMappingURL=kanban.js.map