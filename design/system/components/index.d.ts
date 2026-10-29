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
