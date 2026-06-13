Lato webfont files for Plotypus.

Source: Google Fonts CSS API, downloaded for local/offline use.
Weights included: 400 and 700, latin and latin-ext subsets.
License: SIL Open Font License, as distributed by Google Fonts.

Keep lato.css loaded before style.css so the app can resolve the Lato face
without waiting on a network request. The font faces use font-display: swap so
Chrome does not permanently keep fallback text when the app is opened from
file://.
