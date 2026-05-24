declare const supabase: any;

namespace PrivateKanbanPage {
type KanbanColumnId = 'todo' | 'inprogress' | 'done' | 'archive';
type KanbanIssueType = 'story' | 'task' | 'bug';
type KanbanPriority = '' | 'low' | 'medium' | 'high' | 'highest';

interface KanbanIssue {
    id: string;
    key: string;
    summary: string;
    description: string;
    type: KanbanIssueType;
    priority: KanbanPriority;
    assignee?: string;
    labels: string[];
    column: KanbanColumnId;
    updatedAt: number;
}

interface KanbanBoardState {
    issues: KanbanIssue[];
    order: Record<KanbanColumnId, string[]>;
    nextNumber: number;
}

interface BoardShell {
    render: () => void;
    setState: (nextState: KanbanBoardState) => void;
}

const SUPABASE_URL = 'https://tcgpjwzviqdhbtjsohlq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2lsTFLaVGNdUXczWZ_Mw0w_5UCF9KHZ';
const KANBAN_TABLE = 'kanban_boards';
const PRIVATE_THEME_KEY = 'private-kanban-theme';

const kanbanColumnIds: KanbanColumnId[] = ['todo', 'inprogress', 'done', 'archive'];
const kanbanIssueTypes: KanbanIssueType[] = ['story', 'task', 'bug'];
const kanbanPriorities: KanbanPriority[] = ['', 'low', 'medium', 'high', 'highest'];

function isKanbanColumnId(value: string): value is KanbanColumnId {
    return kanbanColumnIds.includes(value as KanbanColumnId);
}

function isKanbanIssueType(value: string): value is KanbanIssueType {
    return kanbanIssueTypes.includes(value as KanbanIssueType);
}

function isKanbanPriority(value: string): value is KanbanPriority {
    return kanbanPriorities.includes(value as KanbanPriority);
}

function createDefaultKanbanState(): KanbanBoardState {
    const now = Date.now();
    const issues: KanbanIssue[] = [
        {
            id: 'private-issue-101',
            key: 'LW-101',
            summary: 'Set up Supabase auth for the private board',
            description: 'Keep the public board open on the main site and route the real board through /kanban.',
            type: 'story',
            priority: 'highest',
            labels: ['supabase', 'auth'],
            column: 'todo',
            updatedAt: now - 1000 * 60 * 35,
        },
        {
            id: 'private-issue-102',
            key: 'LW-102',
            summary: 'Add a clean private route for the hidden board',
            description: 'Make /kanban feel intentional instead of like a leftover admin screen.',
            type: 'task',
            priority: 'high',
            labels: ['routing', 'vercel'],
            column: 'inprogress',
            updatedAt: now - 1000 * 60 * 18,
        },
        {
            id: 'private-issue-103',
            key: 'LW-103',
            summary: 'Idea: throw rough notes into an archive lane first',
            description: 'Keep messy thoughts somewhere visible without making the main board feel cluttered.',
            type: 'story',
            priority: '',
            labels: ['workflow', 'ideas'],
            column: 'archive',
            updatedAt: now - 1000 * 60 * 65,
        },
        {
            id: 'private-issue-104',
            key: 'LW-104',
            summary: 'Capture smaller personal tasks privately',
            description: 'Use the private board for the messier real-life and work-in-progress stuff.',
            type: 'task',
            priority: '',
            labels: ['personal'],
            column: 'todo',
            updatedAt: now - 1000 * 60 * 80,
        },
        {
            id: 'private-issue-105',
            key: 'LW-105',
            summary: 'Polish the login view',
            description: 'Make the gate feel understated and consistent with the rest of the site.',
            type: 'task',
            priority: 'low',
            labels: ['ui'],
            column: 'done',
            updatedAt: now - 1000 * 60 * 180,
        },
    ];

    return {
        issues,
        order: {
            todo: ['private-issue-101', 'private-issue-104'],
            inprogress: ['private-issue-102'],
            done: ['private-issue-105'],
            archive: ['private-issue-103'],
        },
        nextNumber: 106,
    };
}

function cloneState(state: KanbanBoardState): KanbanBoardState {
    return JSON.parse(JSON.stringify(state)) as KanbanBoardState;
}

function sanitizeBoardState(candidate: unknown): KanbanBoardState {
    const fallback = createDefaultKanbanState();
    if (!candidate || typeof candidate !== 'object') return fallback;

    const parsed = candidate as Partial<KanbanBoardState>;
    if (!Array.isArray(parsed.issues)) return fallback;

    const issues = parsed.issues
        .filter((issue): issue is KanbanIssue => {
            if (!issue || typeof issue !== 'object') return false;
                    const candidateIssue = issue as Partial<KanbanIssue>;
                    return typeof candidateIssue.id === 'string' &&
                        typeof candidateIssue.key === 'string' &&
                        typeof candidateIssue.summary === 'string' &&
                        typeof candidateIssue.description === 'string' &&
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
                    assignee: typeof issue.assignee === 'string' ? issue.assignee : '',
                    labels: issue.labels.filter((label): label is string => typeof label === 'string'),
                    updatedAt: typeof issue.updatedAt === 'number' ? issue.updatedAt : Date.now(),
                }));

    if (!issues.length) return fallback;

    const knownIds = new Set(issues.map(issue => issue.id));
    const sanitizedOrder: Record<KanbanColumnId, string[]> = {
        todo: [],
        inprogress: [],
        done: [],
        archive: [],
    };

    if (parsed.order && typeof parsed.order === 'object') {
        kanbanColumnIds.forEach(columnId => {
            const rawColumn = (parsed.order as Partial<Record<KanbanColumnId, unknown>>)[columnId];
            if (!Array.isArray(rawColumn)) return;

            rawColumn.forEach(item => {
                if (typeof item !== 'string' || !knownIds.has(item)) return;
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

function createSupabaseClient(): any {
    const win = window as Window & { supabase?: any };
    if (!win.supabase) {
        throw new Error('Supabase client could not be loaded.');
    }

    return win.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function setText(element: HTMLElement | null, value: string): void {
    if (element) element.textContent = value;
}

function setHidden(element: HTMLElement | null, hidden: boolean): void {
    if (element) element.classList.toggle('hidden', hidden);
}

function setupThemeToggle(): void {
    const body = document.body;
    const toggle = document.getElementById('private-theme-toggle');
    if (!(body instanceof HTMLBodyElement) || !(toggle instanceof HTMLButtonElement)) {
        return;
    }
    const toggleEl = toggle;

    function applyTheme(theme: 'night' | 'day'): void {
        const isDay = theme === 'day';
        body.classList.toggle('private-kanban-day', isDay);
        toggleEl.textContent = isDay ? 'Night' : 'Day';
        toggleEl.setAttribute('aria-pressed', isDay ? 'true' : 'false');
    }

    let savedTheme: 'night' | 'day' = 'night';
    try {
        const raw = window.localStorage.getItem(PRIVATE_THEME_KEY);
        if (raw === 'day' || raw === 'night') {
            savedTheme = raw;
        }
    } catch {
        savedTheme = 'night';
    }

    applyTheme(savedTheme);

    toggleEl.addEventListener('click', () => {
        const nextTheme: 'night' | 'day' = body.classList.contains('private-kanban-day') ? 'night' : 'day';
        applyTheme(nextTheme);
        try {
            window.localStorage.setItem(PRIVATE_THEME_KEY, nextTheme);
        } catch {
            // ignore theme persistence failures
        }
    });
}

function describeError(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
        return (error as { message: string }).message;
    }

    return 'Unknown error';
}

function createPrivateBoard(client: any, userId: string): BoardShell | null {
    const board = document.querySelector('.kanban-board') as HTMLElement | null;
    const resetButton = document.getElementById('kanban-reset') as HTMLButtonElement | null;
    const dialog = document.getElementById('kanban-dialog') as HTMLDialogElement | null;
    const form = document.getElementById('kanban-form') as HTMLFormElement | null;
    const dialogMode = document.getElementById('kanban-dialog-mode') as HTMLElement | null;
    const dialogTitle = document.getElementById('kanban-dialog-title') as HTMLElement | null;
    const closeButton = document.getElementById('kanban-dialog-close') as HTMLButtonElement | null;
    const cancelButton = document.getElementById('kanban-cancel-btn') as HTMLButtonElement | null;
    const deleteButton = document.getElementById('kanban-delete-btn') as HTMLButtonElement | null;
    const saveButton = document.getElementById('kanban-save-btn') as HTMLButtonElement | null;
    const summaryInput = document.getElementById('kanban-summary-input') as HTMLInputElement | null;
    const descriptionInput = document.getElementById('kanban-description-input') as HTMLTextAreaElement | null;
    const priorityInput = document.getElementById('kanban-priority-input') as HTMLSelectElement | null;
    const statusInput = document.getElementById('kanban-status-input') as HTMLSelectElement | null;
    const labelsInput = document.getElementById('kanban-labels-input') as HTMLInputElement | null;
    const addButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.kanban-add-btn'));
    const syncStatus = document.getElementById('private-sync-status');

    const todoContainer = document.getElementById('kcards-todo') as HTMLElement | null;
    const inprogressContainer = document.getElementById('kcards-inprogress') as HTMLElement | null;
    const doneContainer = document.getElementById('kcards-done') as HTMLElement | null;
    const archiveContainer = document.getElementById('kcards-archive') as HTMLElement | null;

    const todoCount = document.getElementById('kcount-todo') as HTMLElement | null;
    const inprogressCount = document.getElementById('kcount-inprogress') as HTMLElement | null;
    const doneCount = document.getElementById('kcount-done') as HTMLElement | null;
    const archiveCount = document.getElementById('kcount-archive') as HTMLElement | null;

    if (!(board instanceof HTMLElement) ||
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
        !(priorityInput instanceof HTMLSelectElement) ||
        !(statusInput instanceof HTMLSelectElement) ||
        !(labelsInput instanceof HTMLInputElement) ||
        !(todoContainer instanceof HTMLElement) ||
        !(inprogressContainer instanceof HTMLElement) ||
        !(doneContainer instanceof HTMLElement) ||
        !(archiveContainer instanceof HTMLElement) ||
        !(todoCount instanceof HTMLElement) ||
        !(inprogressCount instanceof HTMLElement) ||
        !(doneCount instanceof HTMLElement) ||
        !(archiveCount instanceof HTMLElement)) {
        return null;
    }

    const resetButtonEl = resetButton instanceof HTMLButtonElement ? resetButton : null;
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
    const priorityInputEl = priorityInput;
    const statusInputEl = statusInput;
    const labelsInputEl = labelsInput;

    const columnContainers: Record<KanbanColumnId, HTMLElement> = {
        todo: todoContainer,
        inprogress: inprogressContainer,
        done: doneContainer,
        archive: archiveContainer,
    };

    const countElements: Record<KanbanColumnId, HTMLElement> = {
        todo: todoCount,
        inprogress: inprogressCount,
        done: doneCount,
        archive: archiveCount,
    };

    const columnElements: Record<KanbanColumnId, HTMLElement> = {
        todo: todoContainer.closest('.kanban-col') as HTMLElement,
        inprogress: inprogressContainer.closest('.kanban-col') as HTMLElement,
        done: doneContainer.closest('.kanban-col') as HTMLElement,
        archive: archiveContainer.closest('.kanban-col') as HTMLElement,
    };

    let state = createDefaultKanbanState();
    let draggedIssueId: string | null = null;
    let editingIssueId: string | null = null;
    let saveInFlight = false;
    let pendingSave = false;
    let historyStack: KanbanBoardState[] = [];

    function trimHistoryStack(): void {
        if (historyStack.length > 30) {
            historyStack = historyStack.slice(-30);
        }
    }

    function pushHistorySnapshot(): void {
        historyStack.push(cloneState(state));
        trimHistoryStack();
    }

    function undoLastChange(): void {
        const previousState = historyStack.pop();
        if (!previousState) {
            updateSyncStatus('Nothing to undo');
            return;
        }

        state = sanitizeBoardState(previousState);
        renderKanban();
        requestSave();
        updateSyncStatus('Undoing…');
    }

    function shouldIgnoreUndoShortcut(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) return false;
        return target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement ||
            target.isContentEditable;
    }

    function getIssue(issueId: string): KanbanIssue | undefined {
        return state.issues.find(issue => issue.id === issueId);
    }

    function priorityLabel(priority: KanbanPriority): string {
        return priority === '' ? ''
            : priority === 'highest' ? 'highest'
            : priority === 'high' ? 'high'
            : priority === 'medium' ? 'medium'
            : 'low';
    }

    function createEmptyState(): HTMLElement {
        const empty = document.createElement('div');
        empty.className = 'kanban-empty';
        empty.textContent = 'No issues here yet.';
        return empty;
    }

    function updateSyncStatus(message: string): void {
        setText(syncStatus instanceof HTMLElement ? syncStatus : null, message);
    }

    async function saveBoardState(): Promise<void> {
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
                console.error('Private kanban save failed:', error);
                updateSyncStatus(`Save failed: ${describeError(error)}`);
                saveInFlight = false;
                return;
            }
        } while (pendingSave);

        saveInFlight = false;
        updateSyncStatus('Synced');
    }

    function requestSave(): void {
        void saveBoardState();
    }

    function openDialog(): void {
        if (!dialogEl.open) dialogEl.showModal();
    }

    function closeDialog(): void {
        if (dialogEl.open) dialogEl.close();
        formEl.reset();
        editingIssueId = null;
    }

    function openCreateIssue(columnId: KanbanColumnId): void {
        editingIssueId = null;
        dialogModeEl.textContent = 'Create issue';
        dialogTitleEl.textContent = 'New issue';
        saveButtonEl.textContent = 'Create issue';
        deleteButtonEl.hidden = true;

        summaryInputEl.value = '';
        descriptionInputEl.value = '';
        priorityInputEl.value = '';
        statusInputEl.value = columnId;
        labelsInputEl.value = '';

        openDialog();
        summaryInputEl.focus();
    }

    function openEditIssue(issueId: string): void {
        const issue = getIssue(issueId);
        if (!issue) return;

        editingIssueId = issue.id;
        dialogModeEl.textContent = issue.key;
        dialogTitleEl.textContent = 'Issue details';
        saveButtonEl.textContent = 'Save issue';
        deleteButtonEl.hidden = false;

        summaryInputEl.value = issue.summary;
        descriptionInputEl.value = issue.description;
        priorityInputEl.value = issue.priority;
        statusInputEl.value = issue.column;
        labelsInputEl.value = issue.labels.join(', ');

        openDialog();
        summaryInputEl.focus();
    }

    function removeIssue(issueId: string): void {
        state.issues = state.issues.filter(issue => issue.id !== issueId);
        kanbanColumnIds.forEach(columnId => {
            state.order[columnId] = state.order[columnId].filter(id => id !== issueId);
        });
    }

    function moveIssue(issueId: string, targetColumn: KanbanColumnId, beforeIssueId: string | null, recordHistory = true): void {
        const issue = getIssue(issueId);
        if (!issue) return;

        const currentOrder = state.order[issue.column];
        const currentIndex = currentOrder.indexOf(issueId);
        const targetOrderBeforeMove = state.order[targetColumn];
        const rawTargetIndex = beforeIssueId ? targetOrderBeforeMove.indexOf(beforeIssueId) : targetOrderBeforeMove.length;
        const normalizedTargetIndex = issue.column === targetColumn && rawTargetIndex > currentIndex
            ? rawTargetIndex - 1
            : rawTargetIndex;
        if (issue.column === targetColumn && currentIndex === normalizedTargetIndex) {
            return;
        }

        if (recordHistory) {
            pushHistorySnapshot();
        }

        kanbanColumnIds.forEach(columnId => {
            state.order[columnId] = state.order[columnId].filter(id => id !== issueId);
        });

        const targetOrder = state.order[targetColumn];
        const insertIndex = beforeIssueId ? targetOrder.indexOf(beforeIssueId) : -1;
        if (insertIndex >= 0) {
            targetOrder.splice(insertIndex, 0, issueId);
        } else {
            targetOrder.push(issueId);
        }

        issue.column = targetColumn;
        issue.updatedAt = Date.now();

        requestSave();
        renderKanban();
    }

    function getDropBeforeIssueId(container: HTMLElement, clientY: number): string | null {
        const cards = Array.from(container.querySelectorAll('.kanban-ticket:not(.is-dragging)')) as HTMLElement[];
        let closestOffset = Number.NEGATIVE_INFINITY;
        let closestId: string | null = null;

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

    function clearDragState(): void {
        Object.values(columnContainers).forEach(container => container.classList.remove('is-over'));
        document.querySelectorAll('.kanban-ticket.is-dragging').forEach(card => {
            card.classList.remove('is-dragging');
        });
    }

    function createIssueCard(issue: KanbanIssue): HTMLElement {
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

        top.appendChild(key);
        if (issue.priority) {
            top.appendChild(priority);
        }

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

        card.append(top, summary);
        if (issue.description.trim()) {
            card.appendChild(description);
        }
        if (issue.labels.length) {
            card.appendChild(labels);
        }
        if (footer.childNodes.length) {
            card.appendChild(footer);
        }

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

    function renderKanban(): void {
        const issueMap = new Map(state.issues.map(issue => [issue.id, issue]));

        kanbanColumnIds.forEach(columnId => {
            const container = columnContainers[columnId];
            const columnElement = columnElements[columnId];
            const allIds = state.order[columnId];
            const visibleIssues = allIds
                .map(issueId => issueMap.get(issueId))
                .filter((issue): issue is KanbanIssue => !!issue);

            container.innerHTML = '';
            if (visibleIssues.length) {
                visibleIssues.forEach(issue => {
                    container.appendChild(createIssueCard(issue));
                });
            } else {
                container.appendChild(createEmptyState());
            }

            countElements[columnId].textContent = `${allIds.length}`;

            columnElement.classList.toggle('is-over-limit', columnId === 'inprogress' && allIds.length > 3);
        });
    }

    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            const columnId = button.dataset.col ?? 'todo';
            if (isKanbanColumnId(columnId)) {
                openCreateIssue(columnId);
            }
        });
    });

    kanbanColumnIds.forEach(columnId => {
        const container = columnContainers[columnId];

        container.addEventListener('dragover', event => {
            if (!draggedIssueId) return;
            event.preventDefault();
            container.classList.add('is-over');
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        });

        container.addEventListener('dragleave', event => {
            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !container.contains(nextTarget)) {
                container.classList.remove('is-over');
            }
        });

        container.addEventListener('drop', event => {
            if (!draggedIssueId) return;
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
        const priority = priorityInputEl.value;
        const column = statusInputEl.value;
        const labels = labelsInputEl.value
            .split(',')
            .map(label => label.trim().toLowerCase())
            .filter(Boolean);

        if (!summary || !isKanbanPriority(priority) || !isKanbanColumnId(column)) {
            return;
        }

        if (editingIssueId) {
            const issue = getIssue(editingIssueId);
            if (!issue) return;

            const previousColumn = issue.column;
            const previousSnapshot = cloneState(state);
            issue.summary = summary;
            issue.description = description;
            issue.type = 'task';
            issue.priority = priority;
            issue.assignee = '';
            issue.labels = labels;
            issue.updatedAt = Date.now();

            if (previousColumn !== column) {
                historyStack.push(previousSnapshot);
                trimHistoryStack();
                moveIssue(issue.id, column, null, false);
            } else {
                historyStack.push(previousSnapshot);
                trimHistoryStack();
                requestSave();
                renderKanban();
            }
        } else {
            pushHistorySnapshot();
            const issueId = `private-issue-${state.nextNumber}`;
            const issue: KanbanIssue = {
                id: issueId,
                key: `LW-${state.nextNumber}`,
                summary,
                description,
                type: 'task',
                priority,
                assignee: '',
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
        if (!editingIssueId) return;
        pushHistorySnapshot();
        removeIssue(editingIssueId);
        requestSave();
        renderKanban();
        closeDialog();
    });

    closeButtonEl.addEventListener('click', closeDialog);
    cancelButtonEl.addEventListener('click', closeDialog);

    if (resetButtonEl) {
        resetButtonEl.addEventListener('click', () => {
            pushHistorySnapshot();
            state = createDefaultKanbanState();
            requestSave();
            renderKanban();
        });
    }

    window.addEventListener('keydown', event => {
        const isUndoShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
        if (!isUndoShortcut || shouldIgnoreUndoShortcut(event.target)) {
            return;
        }

        event.preventDefault();
        undoLastChange();
    });

    return {
        render: renderKanban,
        setState: (nextState: KanbanBoardState) => {
            state = sanitizeBoardState(nextState);
            renderKanban();
        },
    };
}

async function bootstrap(): Promise<void> {
    const loginShell = document.getElementById('private-login-shell');
    const boardShell = document.getElementById('private-board-shell');
    const loginForm = document.getElementById('private-login-form');
    const emailInput = document.getElementById('private-email-input');
    const passwordInput = document.getElementById('private-password-input');
    const errorEl = document.getElementById('private-login-error');
    const submitButton = document.getElementById('private-login-submit');
    const logoutButton = document.getElementById('private-logout-btn');
    const routeStatus = document.getElementById('private-route-status');
    const syncStatus = document.getElementById('private-sync-status');
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

    let client: any;
    try {
        client = createSupabaseClient();
    } catch (error) {
        setText(routeStatus instanceof HTMLElement ? routeStatus : null, error instanceof Error ? error.message : 'Supabase failed to load.');
        return;
    }

    let boardUi: BoardShell | null = null;

    async function loadRemoteBoard(userId: string): Promise<KanbanBoardState> {
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

            if (saveError) throw saveError;
            return seeded;
        }

        return sanitizeBoardState(data.board_state);
    }

    async function showSession(session: any): Promise<void> {
        const isLoggedIn = !!session?.user;

        setHidden(loginShell, isLoggedIn);
        setHidden(boardShell, !isLoggedIn);
        setHidden(routeStatus instanceof HTMLElement ? routeStatus : null, false);
        setHidden(userEmail instanceof HTMLElement ? userEmail : null, !isLoggedIn);
        setHidden(logoutButton, !isLoggedIn);
        setHidden(syncStatus instanceof HTMLElement ? syncStatus : null, !isLoggedIn);
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

        try {
            const remoteState = await loadRemoteBoard(session.user.id);
            boardUi.setState(remoteState);
        } catch (error) {
            console.error('Private kanban load failed:', error);
            setText(routeStatus instanceof HTMLElement ? routeStatus : null, `Load failed: ${describeError(error)}`);
        }
    }

    loginForm.addEventListener('submit', async event => {
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

    client.auth.onAuthStateChange((_event: string, session: any) => {
        void showSession(session).catch(error => {
            console.error('Private kanban auth state handling failed:', error);
            setText(routeStatus instanceof HTMLElement ? routeStatus : null, `Auth failed: ${describeError(error)}`);
        });
    });

    const { data, error } = await client.auth.getSession();
    if (error) {
        console.error('Private kanban session lookup failed:', error);
        if (errorEl instanceof HTMLElement) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
        return;
    }

    await showSession(data.session);
}

document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    void bootstrap();
});
}
