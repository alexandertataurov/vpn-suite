# Engagement Pattern Library

## Empty states

Use empty states to educate or convert, not just to state absence.

| Pattern | Best use | Content rule |
|---------|----------|--------------|
| `EmptyStateBlock` | No data exists yet | Explain the benefit of taking the next step |
| `DevicesEmptyState` | No devices issued | Tell the user how to add the first device |
| `PageStateScreen` | Route-level empty state | Keep the path forward obvious |
| `FallbackScreen` | Error or failed load | Explain what happened and offer retry |

## Loading states

| Pattern | Best use | Rule |
|---------|----------|------|
| `Skeleton` | Content-heavy surfaces | Match the eventual layout closely |
| Inline loader | Button or local action | Keep the label in context while loading |
| Progress indicator | Multi-step flow | Show progress without clutter |

## Success states

- Use lightweight confirmation for successful actions.
- Keep success messages specific, for example `VPN connected successfully`.
- Pair the message with the next useful action when one exists.
- Use motion sparingly and keep it transform/opacity based.

## Error states

- Explain what failed in product language, not HTTP language.
- Add one concrete recovery action.
- Keep support access close to the error when the user cannot self-serve.
- Avoid dead-end banners with no retry or follow-up path.

## Help and guidance

- Use inline helper text for constraints and before the user acts.
- Use footers and support blocks for escalation.
- Prefer short educational copy over long paragraphs.

## Recommended surfaces

- Home: `NoDeviceCallout`, `RenewalBanner`, `FooterHelp`
- Devices: row skeletons, empty state, config success feedback
- Plan: billing skeleton, upgrade/renew confirmation, retryable load errors
- Onboarding: step confirmations, app handoff feedback, progress save notices

