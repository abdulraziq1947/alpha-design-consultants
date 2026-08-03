# Alpha Design Consultants — Website

Official website for **Alpha Design Consultants** (formerly Jadoon Consulting Engineers), a PEC-registered structural & civil engineering consultancy with offices in Rawalpindi (Bahria Town) and Peshawar (Hayatabad).

Built with plain **HTML, CSS and vanilla JavaScript** — no build step, no frameworks — so it can be hosted directly on GitHub Pages.

## Structure

```
index.html        Home — hero, services overview, strengths, featured projects
about.html        Company story, mission/values, leadership, staff, certifications
services.html     All 9 service lines, software & codes, design methodology
projects.html     Categorized project portfolio
contact.html      Phones, WhatsApp, email, offices and Google Map
css/styles.css    Site-wide stylesheet (design system + components)
js/main.js        Mobile nav, scroll-reveal, footer year
assets/img/       Logo, favicon and project images (extracted from company profile)
```

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `alpha-design-consultants`).
2. Push this folder to the `main` branch:

   ```bash
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```

3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment**, set Source to **Deploy from a branch**, pick `main` and `/ (root)`, then save.
5. The site will be live at `https://<username>.github.io/<repo>/` within a minute or two.

All asset paths are relative, so the site works both at a domain root and under a repository subpath.

## Updating content

- **Office interior photos** (when available): drop them into `assets/img/` and add them to the About or Contact page.
- **New projects**: copy an existing `project-card` block in `projects.html` and swap the image, title and description.
- **Contact details**: phone numbers and addresses appear in the top bar, contact page and footer of every page.
