# Firebase Setup Guide

## Create the Project

1. Open Firebase Console and create a project.
2. Add a Web App.
3. Copy the web app config into js/firebase-config.js.

## Enable Firestore

Create a Firestore database in production mode. The app uses these locations:

- submissions
- settings/app

## Enable Admin Authentication

Authentication is optional for setup, but recommended for production admin access.

1. Open Authentication.
2. Enable Email/Password.
3. Create an admin user.

## Recommended Firestore Rules

~~~js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{submissionId} {
      allow create: if request.resource.data.participant.phoneNormalized is string
        && request.resource.data.participant.fullName is string
        && request.resource.data.picks.champion is list;
      allow read: if true;
      allow update, delete: if request.auth != null;
    }
    match /settings/app {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
~~~

## Launch Checklist

- Add Firebase keys.
- Publish Firestore rules.
- Create admin account.
- Enter official Round of 32 teams.
- Update deadline, prizes, passcode, and points.
- Submit one test prediction and verify it appears in the dashboard.
