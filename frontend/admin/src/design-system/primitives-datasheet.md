Primitives
Design System Component Library  —  Dark Terminal Aesthetic
 Buttons  Inputs  Badges  Toggles  Alerts  Progress  Tags  Stat Cards 

AT A GLANCE

14
Component Types	1
CSS File (tokens)	6
Semantic Variants	Zero
JS dependencies (pure CSS/HTML)

COMPONENT INVENTORY

COMPONENT	VARIANTS / SIZES	STATES	NOTES
Button	default · primary · solid · ghost · success · warning · danger	normal · hover · disabled	3 sizes (sm/md/lg), icon-only, icon+label
Input	default · prefix · suffix adornment	default · focus · error · success · disabled	Full-width or fixed width
Textarea	default	default · focus · disabled	Resizable, min-height 80px
Select	default	default · focus · disabled	Custom arrow via CSS, appearance:none
Checkbox	default · danger	unchecked · checked · indeterminate · disabled	Accessible with :focus-visible ring
Radio	default	unselected · selected · disabled	Group via shared name attribute
Toggle	default · success · danger	off · on · disabled	Animated thumb transition 0.15s
Badge	neutral · success · warning · danger · info · accent	static · pulse	3 sizes (sm/md/lg), count sub-type
Tag/Chip	default	default · hover · removable	Dismissible with × button
Alert	info · success · warning · danger	static	Icon + title + description layout
Progress	info · success · warning · danger · indeterminate	static · animated	3px track, CSS-only indeterminate
Stat Card	default	static	KPI values, deltas, meta chips
Skeleton	default	animated	Loading placeholder, 1.6s shimmer
Divider	subtle · bright	default	Section separators, hairlines

SEMANTIC VARIANTS

DISPLAY	PROP VALUE	HEX COLOR	SEMANTIC MEANING & USAGE
  NEUTRAL  	neutral	#8A9AA8	Default UI state, inactive, unselected. Use for labels without semantic weight.
  SUCCESS  	success	#3DBA6A	Healthy, online, confirmed, completed. Nominal operating status.
  WARNING  	warning	#E8A020	Degraded performance, elevated risk, needs attention. Not yet critical.
  DANGER  	danger	#E85050	Critical error, offline, destructive action, validation failure.
  INFO  	info	#4A9EE8	Informational, neutral highlight, in-progress, selected interactive.
  ACCENT  	accent	#A070E8	Special emphasis, secondary CTAs, metadata tagging.

DESIGN TOKEN REFERENCE

TOKEN	VALUE	USAGE
--bg	#0D0F10	Page background — deepest layer
--surface-1	#121618	Card, input background
--surface-2	#171B1E	Hover/raised surfaces, adornments
--surface-3	#1D2226	Active/pressed surfaces
--surface-4	#232A2F	Deepest inset surfaces (v2)
--border-default	#252B30	Default borders on all components
--border-bright	#2E363C	Elevated borders, hover states
--border-focus	#3A8CFF	Focus ring color — all focusable elements
--text-primary	#C8D2DA	Primary text, headings
--text-secondary	#8A9AA8	Body text, labels
--text-muted	#4E5E6A	Placeholders, hints, metadata
--text-disabled	#313C44	Disabled state text
--font-mono	IBM Plex Mono	All UI labels, badges, code, buttons
--font-sans	IBM Plex Sans	Body text, descriptions, hints
--r-sm	2px	Component border-radius (inputs, badges, buttons)
--r-md	3px	Card border-radius (alerts, stat cards)
--r-lg	6px	Large containers (v2)

QUICK USAGE PATTERNS

// Button — primary action
<button class="btn btn-md btn-primary">Deploy</button>
// Badge — live status pulse
<span class="badge badge-md badge-success"><span class="dot pulse"></span>Online</span>
// Input — with validation error
<input type="text" class="input is-error" value="invalid">
// Toggle — success variant
<label class="toggle-wrap success"><input type="checkbox" class="toggle-input" checked><span class="toggle-track"><span class="toggle-thumb"></span></span></label>
// Alert — critical
<div class="alert danger"><span class="alert-icon">✕</span><div class="alert-body"><div class="alert-title">Critical</div><div class="alert-desc">Node unreachable.</div></div></div>
