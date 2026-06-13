# Setup

Use this reference before installing or wiring `@bks/ds-system-sdk` in a consumer app.

## Install

Use the package manager already used by the consumer project.

```bash
pnpm add @bks/ds-system-sdk
```

If the user asks for a specific version, install that version:

```bash
SDK_VERSION=1.2.3
pnpm add @bks/ds-system-sdk@$SDK_VERSION
```

Replace `1.2.3` with the version requested by the user.

For npm or yarn projects, use the equivalent command.

## CSS

Import SDK CSS once near the consumer app root:

```ts
import "@bks/ds-system-sdk/styles.css"
```

Place it with global app styles, before rendering UI that uses SDK components.

## Component Imports

Use root imports for convenience:

```tsx
import { Button, Card, CardContent } from "@bks/ds-system-sdk"
```

Use subpath imports when the consumer project prefers narrower imports:

```tsx
import { Button } from "@bks/ds-system-sdk/button"
import { Card, CardContent } from "@bks/ds-system-sdk/card"
```

Do not copy component source from the SDK into the consumer app.

## Tailwind v4

The SDK CSS contains:

```css
@source "./*.js";
```

Do not add extra Tailwind content scanning for SDK build files unless the consumer app has its own unusual build pipeline and styles are proven missing.

## Quick Checks

If SDK components render unstyled:

1. Confirm `@bks/ds-system-sdk/styles.css` is imported once.
2. Confirm the import runs before SDK UI renders.
3. Confirm the installed package version contains `dist/styles.css`.
4. Confirm the consumer app build includes global CSS from packages.

If imports fail:

1. Check whether the component exists in the installed SDK version.
2. Try root import from `@bks/ds-system-sdk`.
3. Try the documented subpath import, such as `@bks/ds-system-sdk/button`.
4. Upgrade the package only when the user approves or requested latest behavior.
