/** Navigation and footer menu groups. `hash` = anchor on landing (prefixed by `base`), `href` = route. */
export interface NavItem {
  label: string
  href?: string
  hash?: string
}
export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Track record',
    items: [
      { label: 'Proof of Intelligence', href: '/proof' },
      { label: 'Prediction of the Day', href: '/daily-call' },
      { label: 'ELYSIA vs KOL', href: '/leaderboard' },
      { label: 'Burn tracker', href: '/burn' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Rug radar', href: '/rug-radar' },
      { label: 'Ask ELYSIA', href: '/ask' },
      { label: 'Signals API', href: '/signals' },
    ],
  },
  {
    label: 'Plans',
    items: [
      { label: 'ELYSIA Pro · Soon', href: '/pro' },
      { label: 'Sponsored report', href: '/sponsored' },
      { label: 'Pricing overview', hash: '#pricing' },
    ],
  },
]

/** Direct navigation items on landing header outside dropdown groups. */
export const NAV_DIRECT: NavItem[] = [
  { label: 'How it works', hash: '#how' },
  { label: 'Token', hash: '#token' },
]

export const itemHref = (i: NavItem, base: string) => i.href ?? `${base}${i.hash ?? ''}`
