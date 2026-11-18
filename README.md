# Balance Bite

A responsive bowl ordering and customization website built with HTML, CSS, and vanilla JavaScript. The project includes a custom Node.js static file server and a 190-frame food preparation animation.

## Run locally

Requires Node.js 18 or newer. Start the server with:

```sh
node server.js
```

Then open <http://localhost:280>. Set the `PORT` environment variable to use another port.

The site also works as static files when served from a web server. Open `index.html` through a local web server rather than directly from the filesystem so its assets and browser storage work consistently.

## Project files

- `index.html`, `home.html`, `bowl-details.html`, `build-your-own.html`, `checkout.html`: site pages
- `style.css`, `shared.js`, `app.js`: shared styles and browser functionality
- `server.js`: lightweight Node.js development server
- `Ingredients_filling_wooden_bowl_8cbfab86_1080p_frames/`: animation frames used by the site

The chef recommendation chat uses a local fallback and does not require an API key. Never put API credentials in browser JavaScript or commit them to the repository.
