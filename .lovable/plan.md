# Add eye icon to show/hide password

Add a small eye toggle inside every password input so users can reveal what they typed.

## Where

- `src/routes/login.tsx` — Password + Confirm password
- `src/routes/reset-password.tsx` — New password + Confirm
- `src/routes/admin.reset-password.tsx` — New password + Confirm

## How it looks and behaves

- Eye icon sits on the right side of the input (inside it).
- Click toggles the field between hidden dots and visible text.
- Icon switches between `Eye` and `EyeOff` from lucide-react.
- Each field toggles independently.
- Keeps existing styling, validation, autocomplete, and min-length rules.

## Technical

- Add a small `PasswordField` wrapper component in `login.tsx` (relative container, input with `pr-11`, absolutely-positioned `<button type="button">` with `aria-label`).
- Reuse the same pattern in the two reset-password routes.
- No backend or schema changes.
