# Add show/hide password toggle

Add an eye icon button inside every password field so users can toggle between hidden and visible text.

## Where it applies

- `src/routes/login.tsx` — sign in + register password fields
- `src/routes/reset-password.tsx` — new password + confirm
- `src/routes/admin.reset-password.tsx` — new password + confirm

## Behavior

- Eye icon on the right edge of the input.
- Click toggles `type` between `password` and `text`.
- Icon switches between `Eye` and `EyeOff` (lucide-react).
- Each field has its own independent toggle state.
- Keeps existing styling, validation, and autocomplete.

## Technical notes

- Add a small `PasswordInput` helper (or inline `useState` per field) wrapping the existing `<input>` with a relative container and an absolutely-positioned toggle button.
- Button: `type="button"`, `aria-label="Show password" / "Hide password"`, focus-visible ring, no form submit.
- No backend or schema changes.
