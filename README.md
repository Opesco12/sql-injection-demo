# SQL Injection Demo (Local Educational App)

This project demonstrates SQL injection in a safe local environment and compares vulnerable query construction vs protected parameterized queries.

## Stack

- Node.js
- Express
- SQLite (`sqlite3`)
- Plain HTML, CSS, and vanilla JavaScript

## Routes

- `/login` - product-style login page
- `/dashboard` - simple dashboard shown after login
- `/demo` - SQL injection lab with vulnerable/protected mode and debug panel

## Safety Notice

This app is for local educational use only.
Do not test techniques on systems you do not own or have explicit permission to test.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/demo`

## Demo Accounts

- `admin / admin123`
- `emmanuel / pass123`
- `guest / guest123`

## Notes

- Passwords are intentionally plain text in this educational demo to keep SQL injection behavior easy to observe.
- Real applications must hash passwords.
