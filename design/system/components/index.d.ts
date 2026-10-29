import type { ReactNode } from 'react';
export interface WordmarkProps { variant?: 'dark' | 'primary' | 'reversed' | 'one-color'; size?: number; mark?: boolean; tagline?: string }
export interface ButtonProps { variant?: 'primary' | 'secondary' | 'link'; href?: string; onClick?: () => void; disabled?: boolean; children: ReactNode }
export interface NavLink { label: string; href?: string; onClick?: (e: unknown) => void; current?: boolean; group?: 'pillars' }
export interface NavBarProps { links?: NavLink[]; tagline?: string | null; homeHref?: string }
export interface RenderPlaceholderProps { label?: string; ratio?: string }
export interface Pillar { name: string; label: string; scope: string[] }
export interface PillarPanelsProps { pillars: Pillar[]; open?: number; height?: string }
export interface StatementProps { eyebrow?: string; headline: ReactNode; paragraph?: ReactNode; caption?: ReactNode }
export interface SolutionTileProps { title: string; industry: string; pillars?: string[]; render?: string; href?: string }
export interface TierRowProps { pct: number; name: string; items: string; solution?: { title: string; href?: string } }
export interface CredibilityBandProps { children: ReactNode; linkLabel?: string; href?: string }
export interface CtaBandProps { title: ReactNode; buttonLabel?: string; href?: string }
export interface FooterLink { label: string; href?: string; onClick?: () => void }
export interface FooterProps { social?: FooterLink[]; links?: FooterLink[]; legal?: FooterLink[]; copyright?: string }
export interface CookieBannerProps { onAccept?: () => void; onDecline?: () => void; privacyHref?: string; children?: ReactNode }
export interface CalloutProps { title?: string; children: ReactNode }
export interface StageProps { number: number; name: string; statement: string; deliverables?: string[]; cost?: string }
export interface DataTableProps { caption?: string; columns: { key: string; label: string; mono?: boolean }[]; rows: Record<string, ReactNode>[] }

/* Application: Concepts Hub and Concepts Vault */
export interface TextFieldProps { label: string; type?: 'text' | 'email' | 'number'; value?: string; defaultValue?: string; onChange?: (value: string) => void; hint?: string; error?: string; suffix?: string; optional?: boolean; disabled?: boolean; required?: boolean; name?: string; inputMode?: string; touched?: boolean }
export interface SelectFieldProps { label: string; options: (string | { value: string; label: string })[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; hint?: string; error?: string; optional?: boolean; disabled?: boolean; name?: string }
export interface TextAreaProps { label: string; rows?: number; value?: string; defaultValue?: string; onChange?: (value: string) => void; hint?: string; error?: string; optional?: boolean; disabled?: boolean; name?: string }
export interface FileDropProps { label: string; accept?: string; onFiles?: (files: FileList) => void; fileName?: string; hint?: string; error?: string; optional?: boolean; disabled?: boolean; prompt?: string }
export interface CheckboxProps { label: string; checked?: boolean; defaultChecked?: boolean; onChange?: (checked: boolean) => void; disabled?: boolean; name?: string }
export interface RadioProps { legend: string; options: { value: string; label: string }[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; error?: string; disabled?: boolean; name?: string }
export interface SearchFieldProps { label?: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; placeholder?: string; disabled?: boolean }
export interface TabBarProps { tabs: { id: string; label: string }[]; value?: string; defaultValue?: string; onChange?: (id: string) => void; label?: string; panelId?: string }
export interface ListBoxProps { items: { id: string; label: string; meta?: string }[]; value?: string; defaultValue?: string; onChange?: (id: string) => void; label?: string; search?: boolean; searchLabel?: string; height?: string }
export interface ButtonColumnProps { items: { id: string; label: string; private?: boolean }[]; value?: string; defaultValue?: string; onChange?: (id: string) => void; label?: string }
export type StatusKind = 'status' | 'build' | 'feedback';
export interface StatusPillProps { kind?: StatusKind; value: string; label?: string }
export interface StatusSelectProps { kind?: 'status' | 'build'; value: string; onChange?: (value: string) => void; label?: string; options?: string[]; disabled?: boolean }
export interface LogColumn { key: string; label: string; type?: 'text' | 'status' | 'build' | 'file'; filter?: boolean }
export interface LogTableProps { columns: LogColumn[]; rows: ({ id: string } & Record<string, unknown>)[]; selected?: string[]; defaultSelected?: string[]; onSelectedChange?: (ids: string[]) => void; onCellChange?: (rowId: string, key: string, value: string) => void; onAction?: (action: 'open' | 'archive', row: unknown) => void; defaultSort?: { key: string; dir: 'asc' | 'desc' }; height?: string; label?: string }
export interface PdfPreviewProps { src?: string; name?: string; size?: 'sm' | 'md' | 'lg'; alt?: string }
export interface DetailPaneProps { title?: string; description?: string; whenToUse?: string; preview?: { src?: string; alt?: string }; revisions?: { id: string; label: string }[]; revision?: string; onRevision?: (id: string) => void; onDownload?: () => void; downloadHref?: string; downloadLabel?: string; expanded?: boolean; onToggleExpand?: (expanded: boolean) => void; empty?: boolean; emptyTitle?: string; emptyText?: string }
export interface GrabLayoutProps { tabs?: { id: string; label: string }[]; tab?: string; onTab?: (id: string) => void; columnA: ReactNode; columnB: ReactNode; detail: ReactNode; detailOpen?: boolean; onBack?: () => void; expanded?: boolean; backLabel?: string }
export interface FixLayoutProps { buttons: ReactNode; children: ReactNode }
export interface VaultShellProps { tabs: { id: string; label: string }[]; tab: string; onTab: (id: string) => void; actions?: ReactNode; children: ReactNode; homeHref?: string }
export interface BuilderLayoutProps { form: ReactNode; preview: ReactNode; previewLabel?: string }
export interface ModalProps { open: boolean; title: string; onClose?: () => void; children: ReactNode; actions?: ReactNode; role?: string }
export interface ConfirmDialogProps { open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void }
export interface ToastProps { tone?: 'success' | 'info' | 'warning' | 'error'; children: ReactNode; onClose?: () => void }
export interface StateMessageProps { kind?: 'empty' | 'loading' | 'error'; title?: string; children?: ReactNode; action?: ReactNode }
export interface StagedBarProps { count: number; onApply?: () => void; onDiscard?: () => void }
export interface StepRailProps { steps: string[]; active: number; label?: string }
export interface ConfigBarProps { value: string; onChange?: (value: string) => void; onReload?: () => void; onBack?: () => void; onNext?: () => void; nextLabel?: string; backDisabled?: boolean; hint?: string; error?: string }
export interface StationValues { name?: string; type?: string; speed?: string; parts?: string; length?: string; width?: string; air?: string; electrical?: string; flow?: 'Left → Right' | 'Right → Left' | 'Vertical' }
export interface StationCardProps { index: number; values: StationValues; onChange?: (key: keyof StationValues, value: string) => void; onRemove?: () => void; types?: string[] }
export interface AddStationProps { onClick?: () => void; label?: string }
export interface LayoutPreviewProps { stations: { name: string; flow?: string; type?: string }[] }
export interface WelcomeScreenProps { heading: ReactNode; text?: string; onStart?: () => void; href?: string; startLabel?: string; pattern?: string }
export interface ChatMessage { id: string | number; role: 'visitor' | 'agent'; text: string; streaming?: boolean }
export interface ChatWindowProps { messages: ChatMessage[]; onSend?: (text: string) => void; busy?: boolean; error?: string; onRetry?: () => void; handoff?: { onContact: () => void }; notice?: string }
export interface DrawingInfo { number: string; title: string; date: string; size?: string; version: string; scale: string; sheet?: number; of?: number; notice?: string; tolerances?: string; email?: string; phone?: string }
export interface DrawingSheetProps { orientation?: 'landscape' | 'portrait'; drawing: DrawingInfo; children?: ReactNode }
export interface StationBoxProps { kind?: 'station' | 'cabinet' | 'tentative' | 'highlight'; x: number; y: number; w: number; h: number; number?: number; name: string; type?: string; size?: string; speed?: string }
export interface DrawingLineProps { kind?: 'object' | 'hidden' | 'center' | 'dimension'; x1: number; y1: number; x2: number; y2: number; label?: string }
export interface FlowArrowProps { x1: number; y1: number; x2: number; y2: number }
export interface ScheduleTableProps { columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[]; rows: Record<string, ReactNode>[]; caption?: string }
export interface ProcessListProps { items: (string | { title: string; text?: string })[] }
