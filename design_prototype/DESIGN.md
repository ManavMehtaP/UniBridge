---
name: Academic Intelligence System
colors:
  surface: '#fbf8ff'
  surface-dim: '#dbd9e1'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fa'
  surface-container: '#efedf4'
  surface-container-high: '#e9e7ef'
  surface-container-highest: '#e4e1e9'
  on-surface: '#1b1b21'
  on-surface-variant: '#454651'
  inverse-surface: '#303036'
  inverse-on-surface: '#f2eff7'
  outline: '#767682'
  outline-variant: '#c6c5d3'
  surface-tint: '#4b57aa'
  primary: '#142175'
  on-primary: '#ffffff'
  primary-container: '#2e3a8c'
  on-primary-container: '#9ea9ff'
  inverse-primary: '#bcc3ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#370086'
  on-tertiary: '#ffffff'
  tertiary-container: '#500aba'
  on-tertiary-container: '#bba0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bcc3ff'
  on-primary-fixed: '#000d60'
  on-primary-fixed-variant: '#333f91'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#fbf8ff'
  on-background: '#1b1b21'
  surface-variant: '#e4e1e9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
  sidebar-width: 260px
---

## Brand & Style

The design system is engineered for a sophisticated academic SaaS environment that bridges the gap between structured learning management and fluid AI-assisted productivity. The personality is "Intellectual, Efficient, and Serene." 

The design style is **Modern Minimalism with Glassmorphic Accents**. It prioritizes high-density information architecture without visual clutter, drawing inspiration from the systematic clarity of professional documentation tools. The aesthetic is defined by ample negative space, precise alignment, and "Smart Layers"—where AI-driven features are distinguished by subtle translucent effects and soft iridescent blurs to signify their dynamic nature.

## Colors

The palette is grounded in professional stability with strategic high-energy accents.

- **Primary (Deep Indigo):** Used for core branding, primary calls to action, and active navigation states. It provides a sense of academic authority.
- **Secondary (Slate):** Utilized for secondary text, iconography, and decorative borders. It grounds the UI in a neutral, professional tone.
- **AI Accent (Violet):** Specifically reserved for generative features, "smart" suggestions, and automated workflows.
- **Functional Accents:** Emerald is used exclusively for completion status and positive feedback; Amber is reserved for temporal urgency like upcoming deadlines.
- **Backgrounds:** A soft `Slate-50` (#F8FAFC) serves as the primary canvas to reduce eye strain during long study sessions.

## Typography

This design system utilizes **Inter** across all roles to ensure maximum legibility and a systematic, "product-first" feel. 

- **Scale:** A tight typographic scale ensures that even information-dense pages (like course syllabi) remain scannable.
- **Hierarchy:** Use `SemiBold` (600) for headlines to create a clear structural anchor. `Medium` (500) is used for interactive labels and titles.
- **Letter Spacing:** Headlines utilize slight negative tracking (-0.01em to -0.02em) for a more modern, compact editorial look, while small labels use positive tracking (+0.05em) for clarity.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model**. 

- **Sidebar:** A fixed left navigation (260px) provides consistent global access. In light mode, it uses a subtle gray-to-white border; in high-contrast scenarios, it can transition to a deep slate background.
- **Grid:** The main content area uses a 12-column fluid grid with a maximum container width of 1280px to prevent line lengths from becoming unreadable on ultra-wide monitors.
- **Mobile:** The sidebar collapses into a bottom-anchored drawer or a top-left "hamburger" menu. Margins compress from 24px (desktop) to 16px (mobile).
- **Rhythm:** An 8px linear scale governs all padding and margin decisions.

## Elevation & Depth

Hierarchy is established through **Tonal Layering and Soft Shadows**. 

1.  **Level 0 (Background):** The canvas (#F8FAFC). No shadow.
2.  **Level 1 (Cards/Surface):** Pure white (#FFFFFF) with a very soft, multi-layered shadow (0px 4px 6px -1px rgba(0,0,0,0.05)) and a 1px border (#E2E8F0).
3.  **Level 2 (Active/Hover):** Slightly more pronounced shadow to indicate interactivity.
4.  **AI Glass Layer:** For AI-generated tooltips or panels, use a backdrop-blur (12px) with a semi-transparent white fill (opacity 70%) and a thin, violet-tinted border. This "floats" above all standard academic content.

## Shapes

The shape language is "Approachable Geometric." 

- **Standard Elements:** Buttons, input fields, and small modules use `rounded-md` (0.5rem/8px).
- **Containers:** Main content cards and modular sections use `rounded-xl` (1rem/16px) to create a soft, modern container feel reminiscent of mobile OS interfaces.
- **AI Components:** Floating AI action buttons may use "Pill" shapes to distinguish them from standard rectangular academic actions.

## Components

- **Buttons:** 
  - *Primary:* Solid Indigo, white text, 8px radius.
  - *Secondary:* Ghost style, Slate border, Slate text.
  - *AI:* Gradient fill (Indigo to Violet) or Glassmorphic white with Violet icon.
- **Cards:** White background, 16px radius, subtle 1px gray border. Header area of cards should have a distinct 8px bottom margin.
- **Inputs:** Focused states use a 2px Primary Indigo ring with 20% opacity. Placeholder text in Slate-400.
- **AI Insight Chips:** Small, violet-tinted translucent badges used for "AI Summarized" or "Smart Suggestion" labels.
- **Sidebar Nav:** Icon-centric with 14px Medium weight labels. Active states indicated by a 4px vertical "pill" on the far left and a subtle background tint.
- **Progress Bars:** Use a thin 4px height for standard progress; use a thicker 8px bar for course completion with Emerald green.