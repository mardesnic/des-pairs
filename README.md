# Pairs

A free puzzle game for young kids that works offline. Draw a line with your finger to join each pair of same-coloured dots. Lines can't cross, and together they have to fill the whole board. Every level is new, and every level can be solved.

Made for ages 5 and up. There is no timer and no way to lose. Drawing back over a line rubs it out, and Undo takes back the last line. When every pair is joined but squares are still empty, those squares light up so you can see what's left.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-pairs/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- New levels made on your device, in four sizes:
  - **Very easy**: a 4×4 board with 3 pairs
  - **Easy**: a 5×5 board with 4 or 5 pairs
  - **Medium**: a 6×6 board with 5 or 6 pairs
  - **Hard**: a 7×7 board with 6 or 7 pairs
- Any answer that joins every pair and fills the board wins, not just one
- A ring for each colour that fills in once that pair is joined
- The next level never has the same dots as the one just played
- A count of levels solved at each size
- Picks up where you left off after a reload
- Keeps the screen on while you play
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode
- No ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # generator, drawing and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.
