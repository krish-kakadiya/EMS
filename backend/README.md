# Backend API

## Auth Endpoints

### POST /api/auth/login
Authenticate with `email` + `password` or `employeeId` + `password`.
Response sets httpOnly cookie `token`.

### GET /api/auth/me (auth required)
Returns authenticated user profile (sans password) plus salary basic and profile info.

### POST /api/auth/logout (auth required)
Clears auth cookie.

### POST /api/auth/send-reset-code
Initiate password reset (sends code to email).

### POST /api/auth/verify-reset-code
Verify reset code & set new password (implementation not shown here).

### POST /api/auth/change-password (auth required)
Change the currently authenticated user password.

Request JSON body:
```
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456@",
  "confirmPassword": "NewPass456@"
}
```
Validation rules:
- All three fields required
- New & confirm must match
- Minimum length 8
- Must contain: lowercase, uppercase, number, special character
- Cannot be the same as current password

Success response:
```
{ "success": true, "message": "Password changed successfully" }
```
Error responses use `{ success:false, message: string }`.

On success a fresh auth token cookie is issued (old session replaced).

## Notes
- Passwords are hashed with bcrypt (pre-save hook in `user.model.js`).
- Never expose stored password hashes in responses.
- Ensure `.env` is not committed; rotate any leaked credentials immediately.
