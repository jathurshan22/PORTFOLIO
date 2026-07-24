# Portfolio Backend (CMS API)

Node.js + Express + MongoDB backend for the portfolio site:
contact inbox, blog CMS, projects, admin auth (JWT).

## Setup

```bash
npm install
cp .env.example .env      # then edit values
npm run create-admin      # creates admin from .env values
npm run dev               # or: npm start
```

MongoDB must be running locally, or use a MongoDB Atlas URI in `MONGO_URI`.
Use `127.0.0.1` instead of `localhost` in local URIs (Node 18+ IPv6 issue).

## API

### Public
| Method | Route | Description |
|---|---|---|
| POST | /api/contact | Send contact message (rate-limited 5/hr) |
| GET | /api/posts | Published posts (`?page=&limit=&tag=`) |
| GET | /api/posts/:slug | Single published post |
| GET | /api/projects | All projects (`?featured=true`) |
| GET | /api/health | Health check |

### Admin (Authorization: Bearer TOKEN)
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/login | Login → returns JWT |
| GET | /api/auth/me | Current admin |
| GET | /api/contact | Inbox (`?page=&unread=true`) |
| PATCH | /api/contact/:id/read | Mark as read |
| DELETE | /api/contact/:id | Delete message |
| GET | /api/posts/admin/all | All posts incl. drafts |
| POST | /api/posts | Create post |
| PUT | /api/posts/:id | Update post |
| DELETE | /api/posts/:id | Delete post |
| POST | /api/posts/upload | Upload image (form field: `image`) → `{ url }` |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

## Frontend contact form example

```js
const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, subject, message })
});
const data = await res.json(); // { success, message }
```
