# Responsive Audit Ledger

Use this document as the running issue ledger for viewport audits in the Telegram Mini App.

## Matrix

- `320x568` - extreme narrow
- `360x800` - compact Android
- `375x667` - iPhone SE class
- `375x812` - compact notched iPhone
- `390x844` - standard iPhone
- `393x852` - iPhone Pro
- `412x892` - Pixel 7 Pro
- `412x915` - Pixel 7
- `428x926` - iPhone Plus
- `430x932` - iPhone Pro Max
- `768x1024` - tablet / Telegram Desktop fallback

## Issue Template

### Issue #N: Short description

- **Screen**:
- **Viewport**:
- **Device**:
- **Priority**: High / Medium / Low
- **Complexity**: Easy / Medium / Hard
- **Screenshot**:
- **Current behavior**:
- **Expected behavior**:
- **Root cause**:
- **Fix class**:
- **Status**: Open / Fixed / Verified

## Audit Notes

- Record one issue per distinct root cause.
- Group repeated overflow or touch-target failures when they share the same component seam.
- Add the matching screenshot name from the Playwright visual-regression run.

## Verification

- Confirm the fix at every matrix viewport.
- Re-run the Playwright responsive suite after each batch of layout changes.
- Update the corresponding Storybook viewport story if the issue is visible there as well.
- CI publishes the generated ledger to `apps/miniapp/test-results/responsive-audit/ledger.md` with the matching screenshots from the same directory.
