# VPN Telegram Bot — Menu Architecture & User Journey

## 1. Bot Purpose

**Primary user goal:** Get a working VPN config in under a minute (connect → plan → pay/free → add device → receive config).

**Secondary goals:** Manage devices (view, reset, reissue), extend subscription, get support, use referral/promo.

**Power-user needs:** Multiple devices, config format choice (AmneziaWG / WG obfuscated / WG standard), quick re-issue without full flow.

**Admin needs:** User/device lookup, revoke/ban, manual config issue, broadcast; all behind role check and confirm tokens.

---

## 2. Global Navigation Structure

```
Main Menu (ReplyKeyboard — role-based)
├─ [NEW CLIENT]
│   ├─ Connect          → Plan list → Pay/Free → Add device → Config choice → Done
│   ├─ Instruction      → Static install guide
│   └─ Support          → Link / handle
│
├─ [EXISTING CLIENT]
│   ├─ My cabinet       → Subscription status + device count
│   ├─ Add device       → Type → Name → Server → Issue → Config choice → Done
│   ├─ Devices          → List → [Config help | Replace | Remove] per device
│   ├─ Reset device     → Pick device → Confirm → Revoke
│   ├─ Invite friend    → Referral link + stats
│   ├─ Promo code       → Enter code (then plan selection)
│   ├─ Connect          → Plans (renew/extend)
│   ├─ Instruction      → Install guide
│   └─ Support          → Link / handle
│
Inline / Callbacks (contextual)
├─ plan:{id}            → Create subscription + invoice or free activation
├─ config_type:awg|wg_obf|wg  → Send chosen config (text + file + QR)
├─ device_type:{key}    → Add device flow
├─ server_select:{id}   → Issue device on server
├─ device_reset:{id} / device_remove:{id}  → Revoke device
├─ config_download:{id} / device_reissue:{id}  → Device list actions
├─ menu:main            → Back to main ReplyKeyboard
├─ menu:devices         → Back to device list
└─ add_device_back_to_type  → Back to device type
```

**Breadcrumb strategy:** Inline “⬅ Back” / “🏠 Home” always return to main menu. No nested breadcrumbs; max depth 2 (list → detail or list → action).

---

## 3. Full User Journeys

### 3.1 First-time user onboarding

| Step | UX | Message / Buttons |
|------|----|--------------------|
| Entry | /start or ref link | “Choose language” [RU] [EN] |
| Set lang | Welcome + menu | “Welcome! Get VPN in under a minute.” + keyboard: [Connect], [Instruction], [Support] |
| Connect | Plan list | “Select a plan:” [Plan A — 0 XTR], [Plan B — 5 XTR], [⬅ Home] |
| Select plan | Invoice or free | Paid: Telegram Stars invoice. Free: “Subscription active. Add device from menu.” + existing menu |
| Add device | Type → Name → Server | “Choose device type” [🍎 iOS] [🤖 Android] … → “Name?” [Skip] [Custom] → “Select server” [S1] [S2] |
| Issue | Config choice (if 3 types) | “Device added! Choose config format:” [AmneziaWG] [WG Obfuscated] [WG Standard] [⬅ Home] |
| Done | Config + file + QR + menu | Config text → .conf file → QR photo → “Install: url” → “OK” + main menu |

**Validation:** Plan exists, user not banned, server active, device limit not exceeded.  
**Errors:** “Service unavailable”, “No server”, “Device limit reached” + stay on same step or menu.  
**Exit:** User has config and main menu (existing-client keyboard).

---

### 3.2 Returning user

| Step | UX | Message / Buttons |
|------|----|--------------------|
| Entry | /start | Language already in state → welcome + **existing** menu (Profile, Add device, Devices, …) |
| Or | Any “Home” | Inline [🏠 Home] → main ReplyKeyboard (API check: show existing menu if has active sub) |

**Decision:** After language, `get_user_by_tg` + active subscription check → one of two keyboards (new vs existing).  
**Exit:** Same as onboarding end state.

---

### 3.3 Purchasing flow

| Step | UX | Message / Buttons |
|------|----|--------------------|
| Entry | Connect or Plans | Plan list (inline) |
| Select plan | create_or_get_subscription + create_invoice | Paid: answer_invoice(Stars). Free: activate sub, “Subscription active…” + menu |
| Payment | Telegram payment | successful_payment → “Payment successful!” + existing menu |
| Failure | Invoice error | “Service temporarily unavailable” + [⬅ Home] |

**Retry:** User can tap Connect again and pick same/other plan.  
**Idempotency:** Idempotency-Key on create-invoice and issue.

---

### 3.4 Device provisioning

| Step | UX | Message / Buttons |
|------|----|--------------------|
| Entry | Add device (menu or after payment) | Require active sub; fetch servers |
| Type | Device type | [iOS] [Android] [Windows] [macOS] [Linux] |
| Name | Skip or custom | [Skip] [Enter custom] or FSM text input |
| Server | If multiple | [Server A] [Server B] … |
| Issue | POST issue | Success → config choice (1 or 3 buttons) or single config sent |
| Config | config_type:* or single | Text + .conf file + QR + Install link + menu |

**Validation:** Sub active, valid_until > now, device count < limit.  
**Errors:** “Subscription invalid”, “Server not available”, “Device limit exceeded”.

---

### 3.5 Error recovery

- **API/network error:** “Service temporarily unavailable. Try again in a moment.” + keep current keyboard or [⬅ Home].
- **Devices list 404/500:** “No devices yet. Add one from the menu.” (or backend fix: list without `issued_configs`).
- **Reset/remove device not found:** “Not found. Device may have been removed.” + [🔄 Refresh list] [⬅ Home].
- **Stuck FSM:** /start clears state and resets to language or main menu.

---

### 3.6 Subscription expired

- **Trigger:** Valid subscription check (valid_until > now, status active).
- **Where:** Add device, Devices, Reset, Cabinet (show status).
- **Message:** “No active subscription.” / “Subscription expired. Renew to continue.”
- **Action:** [Connect] leads to plan list → renew.

---

### 3.7 Admin override

- **Entry:** Admin-only command or hidden trigger (e.g. /admin with role check).
- **Actions:** User lookup (by tg_id), device lookup, revoke device, ban user, manual issue, broadcast.
- **Security:** Backend JWT/admin or bot API key; confirm token for revoke/ban.
- **Flow:** Separate router, `require_permission` or principal check; no exposure in main menu.

---

## 4. State Machine Design

```
[START] ──/start──► [LANG] ──lang_ru/en──► [MAIN]
                         │                      │
                         │                      ├─ Connect ──► [PLAN_LIST] ──plan:id──► [INVOICE/FREE] ──► [MAIN]
                         │                      ├─ Add device ──► [DEVICE_TYPE] ──► [DEVICE_NAME] ──► [SERVER] ──► [ISSUE] ──► [CONFIG_CHOICE] ──► [MAIN]
                         │                      ├─ Devices ──► [DEVICE_LIST] ──config_download|reissue|remove──► [MAIN] / [DEVICE_LIST]
                         │                      ├─ Reset device ──► [RESET_DEVICE_LIST] ──device_reset:id──► [MAIN]
                         │                      └─ menu:main (inline) ──► [MAIN] (refresh keyboard)
                         │
[CONFIG_CHOICE] ──config_type:awg|wg_obf|wg──► send config + [MAIN]
```

**Storage:** aiogram FSM (MemoryStorage or Redis). State keys: `AddDeviceStates.waiting_device_type`, `waiting_device_name`, plus `state.update_data(issued_config_awg=..., issued_device_name=...)` for config choice.

**Stuck states:** /start clears state. Optional: FSM timeout (e.g. 30 min) → clear and send “Session expired. Use /start.”

**Parallel clicks:** Idempotency on issue and create-invoice; callbacks use `callback.answer()` once; critical operations (e.g. issue) can disable buttons after first click (edit reply_markup to remove keyboard).

---

## 5. UX Optimization Rules

| Rule | Implementation |
|------|----------------|
| No message walls | One idea per message; config in &lt;pre&gt;, then file, then QR, then install, then menu. |
| Max 6 buttons per screen | Plan list: N plans + 1 row (Back). Device list: up to 10 devices, 3 buttons per row (Config help, Replace, Remove) + nav row. |
| Clear primary action | New user: [Connect]. Existing: [Add device] and [My cabinet] prominent. |
| Emoji | Minimal: ✅/❌ for status, 📊 cabinet, 🗑 remove, ⬅/🏠 nav. No decorative. |
| Error feedback | get_error_message(key, locale) → short message + “Try again” / “We’re on it.” |
| Loading | For slow API: optional “⏳ One moment…” before answer; or immediate answer with edit after. |

---

## 6. Monetization Integration

| Aspect | Design |
|--------|--------|
| Free vs paid | Plan with price 0 → free_activation; no invoice; sub activated; same “Add device” flow. |
| Upgrade triggers | “Device limit reached” → “Remove device or upgrade plan.” “Subscription expired” → “Renew” (Connect). |
| Contextual upsell | After device limit: message + [Connect] to see plans. |
| Payment confirmation | successful_payment handler → “Payment successful!” + refresh to existing menu. |
| Retry | Failed payment: user can tap Connect again and choose plan again (new invoice). |

---

## 7. Admin Panel Inside Bot

**Menu (admin only):** Hidden unless `principal` is admin (e.g. /admin or callback from admin-only entry).

```
Admin Menu (inline or ReplyKeyboard when admin)
├─ User lookup       → by tg_id → show user + subs + devices
├─ Device lookup     → by device_id → show device + user
├─ Revoke device     → device_id + confirm_token
├─ Ban user          → user_id + confirm_token
├─ Manual issue      → user_id, server_id, (sub_id) → issue config
└─ Broadcast         → compose message → confirm → send to segment (e.g. all users)
```

**Security:** Backend: `require_permission(PERM_*)` or `get_admin_or_bot` and check `isinstance(principal, AdminPrincipal)`. Bot: store admin tg_id list or call backend “am I admin?”.  
**Logging:** Backend audit (request.state.audit_*) for revoke, ban, issue.  
**Destructive:** Revoke/Ban require confirm_token in body; bot shows “Send confirm token” or uses inline confirm with token in env.

---

## 8. Edge Cases

| Case | Handling |
|------|----------|
| Network/API failure | Retry (api_client 3 retries); then “Service temporarily unavailable” + [Home]. |
| User blocks bot | Webhook returns 403; no special menu logic. |
| Double-click | callback.answer() once; idempotency on issue/invoice; optional edit_markup to remove buttons. |
| Expired callback | If state cleared or data missing: “Session expired. Use /start.” and [Home]. |
| Deleted device | Reset/remove returns 404 → “Device may have been removed.” + [Refresh list]. |
| Duplicate provisioning | Backend 409 config_exists → “Config already exists for this device.” |
| Race (two issues) | Device limit check with row lock (backend); second request fails with device_limit_exceeded. |

---

## 9. Performance & Scalability

| Scale | Considerations |
|-------|----------------|
| 10 users | Single instance; MemoryStorage FSM OK. |
| 1,000 users | Redis FSM; rate limit per tg_id (e.g. 30 issue/minute); cache plans/servers (bot already caches get_plans, get_servers). |
| 50,000 users | Multiple bot workers; Redis FSM + Redis for rate limit; callback_data under 64 bytes (use short codes: p:id, s:id, d:id); avoid storing large config in state (or TTL short). |

**Rate limiting:** Backend already has issue_rate_limit_per_minute; bot can add per-user cooldown on “Add device” if needed.  
**Callback data:** Use short prefixes (e.g. `ct:awg` instead of `config_type:config_awg`) if approaching 64-byte limit.  
**Message edit vs new:** Prefer edit for “Select plan” when updating same message; for config result send new messages (text, file, photo, menu).  
**Cache:** get_plans 300s, get_servers 60s (bot utils.cache); invalidate on demand not critical.

---

## 10. Output Summary

1. **Menu tree:** See §2 (ReplyKeyboard by role; inline for plans, config type, device list, reset).
2. **Flow diagrams:** See §3 (onboarding, returning, purchase, provisioning, error, expired, admin).
3. **State machine:** See §4 (START→LANG→MAIN; MAIN→PLAN_LIST→INVOICE; MAIN→DEVICE_TYPE→…→CONFIG_CHOICE→MAIN).
4. **UX principles:** One idea per message; ≤6 buttons; clear primary action; minimal emoji; consistent errors and nav.
5. **Monetization:** Free plan (price 0) vs paid; upgrade on limit/expiry; payment confirmation + menu refresh.
6. **Admin flow:** Separate entry; user/device lookup, revoke, ban, manual issue, broadcast; role + confirm + audit.
7. **Technical hints (aiogram):**
   - Use Router(), F.data.startswith("..."), F.text for menu; register routers in main.
   - FSM: FSMContext, State, StatesGroup; set_state(), get_data(), update_data(); clear on /start.
   - Keyboards: ReplyKeyboardMarkup for main menu (role-based); InlineKeyboardMarkup for lists and choices.
   - Always callback.answer() on callback_query.
   - Use get_error_message(key, locale) and t(locale, key) for i18n.
   - Store minimal data in state; avoid storing full config strings if TTL long (or clear after use).
   - Idempotency-Key header on issue and create-invoice; backend returns 200 with existing resource on replay.
