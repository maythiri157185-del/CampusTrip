# CampusTrip

A real, working web app for planning student group trips — login/signup,
create or join a trip with a code, and a shared trip dashboard with
**Members**, **Expenses**, and **Q&A & Poll** tabs. Built with plain
HTML/CSS/JavaScript and Firebase (Authentication + Firestore). No build
step, no framework, no npm install required.

## What's inside

```
campustrip/
├── index.html            Login
├── signup.html            Sign Up
├── home.html               My Trips (list, + create/join)
├── create-trip.html        New Trip form
├── join-trip.html          Join Trip by code
├── trip.html                Trip Dashboard (Members / Expenses / Q&A & Poll)
├── css/style.css            All styling (navy + orange theme, matches your wireframes)
├── js/
│   ├── firebase-config.js   ⚠️ Paste your Firebase project keys here
│   ├── utils.js              Shared helpers (toasts, formatting, auth guard)
│   ├── auth.js                Login / Sign up logic
│   ├── home.js                My Trips list (live from Firestore)
│   ├── create-trip.js         Create Trip + generates a join code
│   ├── join-trip.js           Join Trip by code
│   └── trip.js                Full dashboard: members, expenses, Q&A, polls
├── firestore.rules          Security rules — only trip members can read/write a trip
└── README.md
```

## 1. Create your Firebase project (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**.
2. Once created, click the **Web** icon (`</>`) to register a web app. You don't need Firebase Hosting for this step — just "register app".
3. Firebase will show you a `firebaseConfig` object. Copy it.
4. Open `js/firebase-config.js` in this package and paste your values in, replacing the placeholders:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## 2. Turn on Authentication

In the Firebase console sidebar: **Build → Authentication → Get started → Sign-in method** →
enable **Email/Password**.

## 3. Turn on Firestore

In the sidebar: **Build → Firestore Database → Create database**. Choose any region close to
your users, and start in **production mode**.

Then go to the **Rules** tab of Firestore and replace the default rules with the contents of
`firestore.rules` from this package, then click **Publish**. These rules make sure only
signed-in trip members can read or write that trip's data.

## 4. Run it

This app needs no build tools — it's just static files — but browsers block some Firebase
requests when opened directly as a `file://` path, so serve it locally instead:

**Option A — VS Code**: install the "Live Server" extension, right-click `index.html` → "Open
with Live Server".

**Option B — Python** (already installed on most machines):
```bash
cd campustrip
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Option C — Node**:
```bash
npx serve campustrip
```

## 5. Try it out

1. Open the app → **Sign Up** with a name, email, and password.
2. On **My Trips**, tap the orange **+** button → **Create Trip**. Fill in a name, destination,
   and dates → **Create Trip**. You're taken to the dashboard with a generated 6-character
   **trip code**.
3. Open the trip's **⋮** menu → **Share Trip Code** to copy it (or open the app in another
   browser / incognito window, sign up as a second user, and use **Join Trip** with that code).
4. In the dashboard:
   - **Members** — see everyone in the trip; the organizer can remove members.
   - **Expenses** — add expenses (hotel, fuel, food, activities...) and see everyone's
     even **Your Share**, calculated automatically as total ÷ number of members.
   - **Q&A & Poll** — ask and answer questions, and create a poll with 2+ options that
     members can vote on live (vote counts and bars update in real time for everyone).

Everything is live: if two people have the trip dashboard open at once, changes from one
appear instantly for the other (Firestore real-time listeners — no page refresh needed).

## Data model (Firestore)

```
users/{uid}                          { name, email, createdAt }

trips/{tripId}                       { name, destination, dateLabel, description,
                                        organizerId, organizerName, code,
                                        memberIds: [uid, ...], createdAt }
  members/{uid}                      { name, email, role: "Organizer" | "Member", joinedAt }
  expenses/{expenseId}               { title, category, amount, paidBy, paidByName, createdAt }
  questions/{questionId}             { question, askedBy, askedByName, createdAt,
                                        answerText, answeredBy, answeredByName, answeredAt }
  polls/{pollId}                     { question, options: [{text, votes}], voters: {uid: index},
                                        createdBy, createdAt }

tripCodes/{code}                     { tripId }   — lets Join Trip look up a trip by its code
```

## Customizing

- **Colors / fonts**: everything lives in `css/style.css` as CSS variables at the top
  (`--navy-900`, `--orange`, etc.) — change once, applies everywhere.
- **Expense categories**: edit the `<select>` in `trip.html` and the `EXPENSE_ICONS` map in
  `js/trip.js`.
- **Deploying for real**: the easiest free option is Firebase Hosting —
  `npm install -g firebase-tools`, then `firebase init hosting` (point it at this folder),
  then `firebase deploy`.

## Notes on scope

This build covers every screen in your wireframes end-to-end with real Firebase data
(no mock/fake data) — sign up/login, create/join trips by code, members, expenses with
auto-calculated share, and Q&A + live polling. Items listed under "Future Improvements" in
your outline (push notifications, Google Maps, weather, QR invites, in-app chat, live
location, AI recommendations) are intentionally left out, since they need extra services
beyond core Firebase and were scoped as future work in your presentation.
