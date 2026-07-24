# Portfolio Website + CMS

My personal portfolio website with a custom-built content management system, so every
section of the site can be updated from an admin panel instead of editing HTML.

Built with **Node.js, Express, MongoDB** and vanilla **HTML / CSS / JavaScript** — no
frontend framework.

---

## Features

**Portfolio site**
- Black & gold theme with a typewriter headline, staggered entrance animations,
  photo reveal and mouse parallax
- Fully responsive, with `prefers-reduced-motion` support
- Projects, education, skills and certificates load dynamically from the database
- Contact form that writes straight into the admin inbox

**Admin panel**
- JWT login with bcrypt-hashed passwords
- Dashboard with live counts for messages and projects
- Project manager — create, edit, reorder, feature, delete, with image upload
- Site Content CMS — edit the hero, about, skills, education, certificates and
  contact details without touching code
- CV upload (PDF) wired to the download button on the site
- Contact inbox with read / unread filtering and delete

**Security**
- Helmet security headers with a strict Content Security Policy
- Rate limiting — 300 requests / 15 min globally, 10 login attempts / 15 min,
  5 contact submissions / hour
- `express-mongo-sanitize` against NoSQL injection
- File upload validation by MIME type and size, with path-traversal guards
- Orphaned uploads are cleaned off disk automatically when content is deleted

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcryptjs |
| Uploads | Multer |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |

---

## Project Structure

```
portfolio/
├── portfolio/                  Frontend (served by the backend)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── admin/                  Admin panel
│       ├── login.html
│       ├── index.html
│       ├── admin.css
│       ├── admin.js
│       └── login.js
│
└── portfolio-backend/
    ├── server.js               App entry point
    ├── config/db.js            MongoDB connection
    ├── models/                 Admin, Contact, Project, SiteContent
    ├── controllers/            Route logic
    ├── routes/                 API route definitions
    ├── middleware/             Auth guard, uploads, error handling
    ├── utils/                  File cleanup helper
    ├── scripts/createAdmin.js  Creates the admin account
    └── uploads/                Uploaded images and CV (gitignored)
```

---

## Getting Started

### Requirements
- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

### Installation

```bash
git clone https://github.com/jathurshan22/PORTFOLIO.git
cd PORTFOLIO/portfolio-backend
npm install
```

### Configuration

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/portfolio
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d

ADMIN_NAME=Your Name
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your_password
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Use `127.0.0.1` rather than `localhost` in a local `MONGO_URI` — Node 18+ resolves
> `localhost` to IPv6 first, which MongoDB may not be listening on.

### Run

```bash
npm run create-admin    # creates the admin account from your .env values
npm start               # or: npm run dev
```

| URL | Page |
|---|---|
| `http://localhost:5000` | Portfolio site |
| `http://localhost:5000/admin/login.html` | Admin panel |

The backend serves the frontend as well, so there is no separate dev server —
Live Server is not needed.

---

## API Reference

### Public

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/site` | Site content (hero, about, skills, education, certificates, settings) |
| `GET` | `/api/projects` | All projects — supports `?featured=true` |
| `POST` | `/api/contact` | Send a contact message (rate limited to 5/hour) |
| `GET` | `/api/health` | Health check |

### Admin — requires `Authorization: Bearer <token>`

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Log in, returns a JWT |
| `GET` | `/api/auth/me` | Current admin details |
| `PUT` | `/api/site` | Update any site content section |
| `POST` | `/api/site/cv` | Upload CV as PDF (field: `cv`) |
| `DELETE` | `/api/site/cv` | Remove the stored CV |
| `POST` | `/api/projects` | Create a project |
| `PUT` | `/api/projects/:id` | Update a project |
| `DELETE` | `/api/projects/:id` | Delete a project and its image |
| `POST` | `/api/projects/upload` | Upload an image (field: `image`), returns `{ url }` |
| `GET` | `/api/contact` | Inbox — supports `?page=` and `?unread=true` |
| `PATCH` | `/api/contact/:id/read` | Mark a message as read |
| `DELETE` | `/api/contact/:id` | Delete a message |

---

## Deployment Notes

- Set `CLIENT_ORIGINS` in `.env` only if the frontend is hosted on a different
  domain from the backend — comma separated, no trailing slash.
- `app.set("trust proxy", 1)` is already configured so rate limiting reads the real
  client IP behind a hosting proxy.
- The `uploads/` folder is not committed to Git. On hosts with an ephemeral
  filesystem, uploaded files are lost on redeploy — use object storage such as
  Cloudinary or S3 for production.
- This is a Node application, so it will not run on GitHub Pages. Render, Railway or
  a similar Node host is required, together with MongoDB Atlas.

---

## Author

**Jathurshan**
BSc (Hons) in Information & Communication Technology
Department of ICT, Faculty of Technology — Rajarata University of Sri Lanka

[GitHub](https://github.com/jathurshan22)
