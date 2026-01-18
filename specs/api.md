# API Notes

## Public
- `GET /api/public/health` -> `{ status: "ok" }`
- `POST /api/public/login?username=demo` -> `{ access_token, token_type, user }`

## User (JWT required)
- `GET /api/user/journal` -> list of entries
- `POST /api/user/journal` -> create entry
- `GET /api/user/mood-calendar` -> mood summary per day
- `GET /api/user/settings` -> settings
- `PUT /api/user/settings` -> update settings

### Entry payload
```json
{
  "text": "string",
  "mood": 1,
  "entry_datetime": "2024-01-01T12:00:00Z"
}
```

## Admin (JWT + is_admin)
- `GET /api/admin/users` -> list of dummy users
