# LCK Dreams FIFA World Cup 2026 Knockout Prediction

A complete static knockout prediction website for the Leo Club of Kathmandu Dreams. It is GitHub Pages compatible, uses Firebase Firestore when configured, and includes a local browser-storage fallback for demos and setup checks.

## Pages

- index.html: participant form and interactive knockout bracket
- rules.html: rules page
- prizes.html: prize section
- leaderboard.html: public leaderboard
- confirmation.html: post-submission confirmation
- admin/index.html: admin dashboard
- docs/firebase-setup.md: Firebase setup guide
- docs/github-pages.md: deployment guide

## Setup

1. Add your Firebase web app keys in js/firebase-config.js.
2. After the group stage, enter the official Round of 32 teams in data/teams.config.js or from the admin dashboard.
3. Update deadline, prizes, passcode, and points in data/scoring.config.js.
4. Publish the folder with GitHub Pages.

The app is fully usable before Firebase setup in local demo mode. Production submissions should use Firebase with the recommended rules in the setup guide.
