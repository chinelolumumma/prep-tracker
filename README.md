# Prep Tracker

I made this because I wanted an easy way to keep track of what my family has stored for emergencies: food, water, medicine, the solar setup, all of it. Spreadsheets got messy fast, so this is the simpler version.

You tell it how many people you're stocking for and how long you want to be covered (anywhere from two weeks to two years), and it works out how much of each thing you need. Then you just log what you have. It shows what to buy next, flags anything that's about to expire, and can add a monthly stock-up day to your calendar.

Everyone in a household shares one list, so when someone buys rice, it shows up on everyone's phone. If you start your own household, your list is completely separate from mine.

**Use it here:** https://chinelolumumma.github.io/prep-tracker

On an iPhone or iPad, open the link in Safari, tap Share, then Add to Home Screen. It'll sit on your home screen like an app and still works when the internet's down.

## Getting started

1. Make an account with your first name, email and a password.
2. Tap **Start household** and give it a name.
3. Tap **Invite** and send the link to the people you live with.
4. Start counting what's in your pantry.

The food list leans savory (rice, beans, pasta, garri, egusi, canned fish) because that's how we eat, but you can add anything at the bottom of the page.

## Running your own copy

It's free. The site runs on GitHub Pages and the syncing runs on Firebase's free plan.

1. Fork this repo, or download it.
2. Create a Firebase project, turn on Email/Password sign-in, and create a Firestore database.
3. Paste `firestore.rules` into Firestore's Rules tab and publish. These rules keep each household's list private.
4. Add a web app in Firebase project settings and copy its config into `firebase-config.js`.
5. Turn on GitHub Pages (Settings → Pages → main branch, root folder).
6. In Firebase, add your `yourname.github.io` address under Authentication → Settings → Authorized domains.

## A note

This is a tracker, not medical advice. For medicine, go with what your doctor recommends and keep an eye on expiry dates.
