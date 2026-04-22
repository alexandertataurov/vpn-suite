# Responsive Design Matrix

## Breakpoint targets

- `320px` - iPhone SE class, smallest supported phone width
- `375px` - common compact iPhone width
- `390px` - default mobile review width in Storybook
- `393px` - iPhone Pro width
- `412px` - Pixel class Android width
- `428px` - large phone width
- `430px` - Pro Max / Plus width
- `768px` - tablet / Telegram Desktop review width

## Matrix

| Surface | 320px | 375px | 390px | 393px | 412px | 428px | 430px | Tablet/Desktop | Notes |
|---------|-------|-------|-------|-------|-------|-------|-------|----------------|-------|
| Home | Keep hero, renewal banner, quick actions, and device rows stacked without overflow | Comfortable default | Primary reference size | Pro width should not increase chrome | Android width should not crowd actions | Large phone width should not over-expand content | Pro Max / Plus width must still read as mobile | Should not exceed the content measure or create long line lengths | This is a conversion surface; preserve CTA separation and safe-area bottom padding |
| Onboarding | Keep step card, back action, and footer help visible without horizontal scrolling | Ideal for dense step copy | Primary reference size | Pro width should not create awkward wrapping | Android width should keep the primary action obvious | More breathing room for illustrations / helper blocks | More horizontal room should not bury the stepper | Can add more vertical whitespace but keep the stepper linear | This flow should never bury the primary action below low-value content |
| Plan | Cards, billing toggles, and history must not compress into unreadable rows | Good default | Primary reference size | Keep CTA hierarchy stable | Keep billing controls aligned | Works as long as history and CTA stack remain separate | Preserve list rhythm on larger phones | Can use wider information density, but keep the main CTA obvious | This is the highest-revenue screen after onboarding |
| Devices | Device rows and config cards must remain touchable and legible | Good default | Primary reference size | Watch for label/subtitle crowding | Android width must keep action affordances visible | Preserve row rhythm | Keep menu affordances reachable | Use wider spacing only if it does not create long scan paths | Prioritize row rhythm and clear device state labels |
| Checkout | Plan summary and payment actions must remain dominant | Good default | Primary reference size | Extra width should not reduce button clarity | Android width should not push actions below the fold | Large phone widths should still read as one step | Keep one obvious next action | Tablet layout can show more plan detail, but keep one obvious next action | Payment flow should minimize distraction |
| Settings | Long labels, toggles, and danger sections must wrap cleanly | Good default | Primary reference size | Menu rows should not become dense | Android width should keep helper text readable | Useful for menu-heavy content | Danger controls must remain reachable | Desktop can expose more grouped controls, but keep content scannable | Do not let helper text force horizontal scroll |
| Support | Disclosure items and troubleshooting steps need readable line lengths | Good default | Primary reference size | Maintain readable disclosure rhythm | Android width should keep FAQ touch targets large | Better for FAQ scanning | More room should not add chrome | Wider layout can show more context, but not more chrome | Help content should stay simple and skimmable |
| Restore Access | Recovery CTAs and explanation copy must stay prominent | Good default | Primary reference size | Keep recovery copy compact | Android width should not obscure primary CTA | Can add room for confirmation detail | Keep urgency visible | Wider layout should not dilute the urgency | Recovery messaging should remain focused |
| Referral | Share card and invite copy should keep the primary share CTA obvious | Good default | Primary reference size | Keep share actions stacked when needed | Android width should not push CTA below the fold | More space helps the referral explanation | Do not empty out the card | Wider view should not make the page feel empty | Share actions should always be easy to find |
| Connect Status | Connection feedback must fit above the fold | Good default | Primary reference size | Keep retry action prominent | Android width should not scatter state details | Can show richer status context | Keep status and actions together | Wider layout should not expand the focal card too far | Success, retry, and troubleshooting should stay close together |

## Safe area and platform rules

- Use `viewport-fit=cover` and honor `safe-area-inset-*` on iOS.
- Keep bottom navigation and action bars above the home indicator.
- Leave enough padding for Telegram Mini App chrome and any native bars.
- Do not rely on hover-only affordances; touch targets must remain at or above `44px` and should prefer `48px` for primary controls.

## Current coverage notes

- The main page contracts already include viewport-specific stories in several places, especially `Home`, `Onboarding`, `Plan`, `Devices`, `Settings`, `Checkout`, `Support`, `Referral`, `RestoreAccess`, and `ConnectStatus`.
- The next step is not adding more viewport demos everywhere; it is using the existing page contracts to resolve overflow, spacing, and touch-target issues consistently.
