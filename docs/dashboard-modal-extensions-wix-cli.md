# Dashboard Modal Extensions in Wix CLI

## Overview
Dashboard Modal Extensions are native, centered pop-up windows inside the Wix dashboard. They are designed for focused user interactions such as confirmations, onboarding, login flows, or subscription prompts.

They are triggered programmatically with the `openModal()` and `closeModal()` functions from the Wix Dashboard SDK.

---

## Why Use Dashboard Modals?
- **Consistent UI**: Always centered and styled to match Wix dashboard design.
- **Reusability**: One modal can be reused across multiple apps.
- **Lightweight Alternative**: Faster than building full dashboard pages when only a small interaction is needed.

---

## Types of Dashboard Extensions

| Extension Type               | Purpose/Use Case                                                |
|------------------------------|------------------------------------------------------------------|
| **Dashboard Page Extension** | Full admin pages for configuration and management interfaces     |
| **Dashboard Modal Extension**| Lightweight pop-ups for focused interactions                     |
| **Dashboard Plugin Extension**| Plugins embedded in dashboard pages via UI slots                 |
| **Dashboard Menu Plugin**    | Menu items that open pages or trigger modals                     |

---

## Implementation with Wix CLI

### 1. Create a Modal
- Run CLI command to scaffold under `src/dashboard/modals`.
- Files generated:
  - `modal.json`: Metadata (auto-generated ID, title, width, height).
  - `modal.tsx`: React component for modal content.

### 2. Open the Modal
- Trigger from a dashboard page:
  ```ts
  import { openModal } from '@wix/dashboard';

  await openModal('myModalId', { someData: 'example' });

  	•	Data passed here can be consumed in the modal via observeState().

3. Close the Modal
	•	Inside modal component:

    import { closeModal } from '@wix/dashboard';

closeModal();

4. Test & Deploy
	•	Test locally with CLI dev preview.
	•	Deploy via Wix Studio’s Custom Apps page.

⸻

Self-Hosted Option
	•	Modals can also be hosted externally.
	•	Register in App Dashboard with metadata (name, size, URL).
	•	Still triggered by openModal() / closeModal().

⸻

Use Case Examples
	•	Confirmation dialogs
	•	Login/signup flows
	•	Subscription or upgrade prompts
	•	Onboarding/tutorial steps
	•	Multi-step wizards