declare const d3: any;
declare const topojson: any;
type SectionId = 'work' | 'projects' | 'about' | 'uses' | 'library' | 'travel' | 'keyboards' | 'board' | 'notes' | 'game';
type GraphNodeType = 'core' | 'menu' | 'detail';
interface CursorSpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    rotation: number;
    spin: number;
}
declare const sectionIds: SectionId[];
declare let currentSection: SectionId;
declare function scrollToSection(sectionId: SectionId, pushHistory?: boolean): void;
declare function setupHashNavigation(): void;
declare function setupEmailCopy(): void;
declare function setupCursorFx(): void;
declare function isLikelyIpAddress(value: string): boolean;
declare function setupDynamicIntro(): Promise<void>;
declare function setupTravelMap(): void;
declare function setupActivityChart(): void;
declare function setupWeeklyGrid(): void;
declare function setupProjectArchiveTabs(): void;
type KanbanColumnId = 'backlog' | 'selected' | 'inprogress' | 'done';
type KanbanIssueType = 'story' | 'task' | 'bug';
type KanbanPriority = 'low' | 'medium' | 'high' | 'highest';
type KanbanFilter = 'all' | KanbanIssueType;
interface KanbanIssue {
    id: string;
    key: string;
    summary: string;
    description: string;
    type: KanbanIssueType;
    priority: KanbanPriority;
    assignee: string;
    labels: string[];
    column: KanbanColumnId;
    updatedAt: number;
}
interface KanbanBoardState {
    issues: KanbanIssue[];
    order: Record<KanbanColumnId, string[]>;
    nextNumber: number;
}
declare const kanbanStorageKey = "portfolio-jira-board-v1";
declare const kanbanColumnIds: KanbanColumnId[];
declare const kanbanIssueTypes: KanbanIssueType[];
declare const kanbanPriorities: KanbanPriority[];
declare function isKanbanColumnId(value: string): value is KanbanColumnId;
declare function isKanbanIssueType(value: string): value is KanbanIssueType;
declare function isKanbanPriority(value: string): value is KanbanPriority;
declare function createDefaultKanbanState(): KanbanBoardState;
declare function setupKanban(): void;
interface GNode {
    id: string;
    label: string;
    type: GraphNodeType;
    description?: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    targetX: number;
    targetY: number;
    sectionId?: SectionId;
}
interface GEdge {
    source: string;
    target: string;
}
declare function setupGraph(): void;
interface NoteEntry {
    id: string;
    date: string;
    tag: string;
    body: string;
}
declare const NOTES_KEY = "portfolio-notes-v1";
declare const defaultNotes: NoteEntry[];
declare function setupNotes(): void;
declare function setupSnakeGame(): void;
declare function setupScrollProgress(): void;
//# sourceMappingURL=app.d.ts.map