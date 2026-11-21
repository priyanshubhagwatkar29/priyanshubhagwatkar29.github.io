# Chess Tutor V4

A responsive, browser-based chess learning app hosted at:

https://priyanshubhagwatkar29.github.io/chess/

## Modes

- **Practice / Tutor**: move-by-move analysis, strategy explanations, hints, candidate plans and alternative variations.
- **Game Mode**: uninterrupted play, local training-rating estimate and full post-game review.

## Game archive

Games are saved in browser storage first. To sync them to GitHub across devices:

1. Create a GitHub fine-grained personal access token at https://github.com/settings/personal-access-tokens/new.
2. Grant only **Gists: read and write** (the app uses Gists; it does not need repository write access).
3. Open Chess Tutor, paste the token in **GitHub cloud backup**, and choose **Connect & sync**.
4. The app creates or updates one **public Gist** containing `chess-tutor-games.json`.
5. On another device, paste the public Gist URL or ID into **Restore archive** to merge the saved games.

The token is held in session storage in the browser, not written into this repository or the public Gist. The Gist itself is public, so anyone with its link can read the games.

## Technical notes

- Chess rules: chess.js.
- Engine: Stockfish browser/WASM build when available.
- The app includes a legal-move fallback if the remote engine cannot be loaded.
- Games and settings are local to each browser until GitHub cloud backup is connected.
- The local rating is an estimate for training. It is not an official FIDE rating.
