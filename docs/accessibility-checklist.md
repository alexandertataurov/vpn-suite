# Accessibility Checklist (WCAG for Mobile Apps)

This checklist defines minimum accessibility requirements (WCAG 2.2 A + AA) for mobile applications.

All UI features must pass this checklist before release.

---

## 1. Touch Targets

### Requirements

- [ ] All interactive elements are at least **24×24 px minimum** (WCAG 2.2 AA).
- [ ] Recommended target size: **48×48 px** for mobile usability.
- [ ] Interactive controls have at least **8px spacing** between targets.
- [ ] Icons inside tap targets remain visually centered.
- [ ] Buttons near screen edges have **>=16px margin from edges**.

### Applies to

- Buttons
- Toggles
- Tabs
- List items
- Icon buttons

---

## 2. Gesture Accessibility

### Requirements

- [ ] Any gesture requiring **drag or swipe** has a **tap alternative**.
- [ ] Multi-finger gestures are not required for core functionality.
- [ ] Path-based gestures (drawing shapes/swipes) have simple alternatives.

### Examples

Bad:

```
Swipe only to delete
```

Good:

```
Swipe OR tap delete button
```

---

## 3. Keyboard and External Input Support

### Requirements

- [ ] App is operable using **external keyboard navigation**.
- [ ] Logical **focus order** matches visual layout.
- [ ] Focus indicator is clearly visible.
- [ ] Focus is never hidden behind sticky headers or overlays.

### Test

- Navigate app using **Tab / arrow keys**.
- Verify all interactive elements are reachable.

---

## 4. Screen Reader Compatibility

### Requirements

- [ ] All interactive controls have **accessible names**.
- [ ] Inputs have **programmatic labels**.
- [ ] Icon-only buttons include accessible labels.
- [ ] Screen reader reading order matches visual order.

### Examples

Bad:

```
Icon button with no label
```

Good:

```
aria-label="Delete message"
```

---

## 5. Text and Readability

### Requirements

- [ ] Body text contrast ratio >= **4.5:1**.
- [ ] Large text contrast >= **3:1**.
- [ ] Text remains readable when system font size increases.
- [ ] Layout supports **text scaling / zoom** without breaking.

### Applies to

- Body text
- Labels
- Buttons
- UI hints

---

## 6. Color Usage

### Requirements

- [ ] Information is **not conveyed by color alone**.
- [ ] Status messages include **text or icons**.
- [ ] Error states include both **color + text explanation**.

### Example

Bad:

```
Red border only
```

Good:

```
Red border + error text
```

---

## 7. Forms and Inputs

### Requirements

- [ ] All inputs have visible labels.
- [ ] Required fields are clearly indicated.
- [ ] Error messages clearly explain what went wrong.
- [ ] Error messages appear **near the input field**.

### Good UX

```
Email is required
Please enter a valid email address
```

---

## 8. Authentication Accessibility

### Requirements

- [ ] Login supports **password managers**.
- [ ] Copy/paste is allowed in login fields.
- [ ] Authentication does not rely only on memory puzzles.
- [ ] Biometrics are allowed but not required.

---

## 9. Motion and Animation

### Requirements

- [ ] Animations do not trigger vestibular motion issues.
- [ ] Respect **system Reduce Motion settings**.
- [ ] Critical actions do not rely on animation cues.

### Avoid

- Parallax motion
- Excessive scrolling effects

---

## 10. Timing and Interruptions

### Requirements

- [ ] If a time limit exists, users can extend it.
- [ ] Critical flows are not interrupted automatically.
- [ ] Session timeouts warn the user first.

---

## 11. Error Handling

### Requirements

- [ ] Errors are clearly identified.
- [ ] Error messages explain how to fix the issue.
- [ ] Form validation does not rely only on color.

---

## 12. Layout and Reflow

### Requirements

- [ ] Content remains usable when zoomed.
- [ ] Layout supports **screen orientation changes**.
- [ ] Content does not require horizontal scrolling.

---

## 13. Assistive Technology Support

### Requirements

- [ ] Works with screen readers (VoiceOver / TalkBack).
- [ ] Works with switch control.
- [ ] Works with external keyboards.

---

## 14. Notifications and Feedback

### Requirements

- [ ] Important messages are announced to screen readers.
- [ ] Alerts provide descriptive messages.
- [ ] Toast notifications remain visible long enough to read.

---

## 15. Testing Requirements

Accessibility must be tested on:

- [ ] iOS (VoiceOver)
- [ ] Android (TalkBack)
- [ ] External keyboard navigation
- [ ] Increased font size
- [ ] High contrast mode

---

## 16. Definition of Done

A feature is considered accessible only if:

- [ ] All controls meet target size requirements.
- [ ] Screen readers can navigate and understand UI.
- [ ] Color contrast passes WCAG thresholds.
- [ ] Forms provide clear validation and feedback.
- [ ] App works with keyboard and assistive input.
- [ ] Layout remains usable when text is enlarged.
