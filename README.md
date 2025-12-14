# Personal Portfolio Website

A modern, dark-themed personal portfolio website built with TypeScript. Perfect for junior developers showcasing their projects and skills to potential employers.

## Features

- Clean, minimalist dark theme design
- Fully typed with TypeScript
- Responsive navigation with smooth section transitions
- Project showcase section
- Blog posts section
- Contact information
- Mobile responsive
- No framework dependencies

## Tech Stack

- TypeScript
- HTML5
- CSS3
- Vanilla JavaScript (compiled from TypeScript)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository or download the files

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript files:
```bash
npm run build
```

4. Start a local development server:
```bash
npm start
```

The website will be available at `http://localhost:3000`

### Development

To watch for TypeScript changes and rebuild automatically:
```bash
npm run watch
```

## Project Structure

```
personal-website/
├── src/
│   └── app.ts          # TypeScript source code
├── dist/
│   └── app.js          # Compiled JavaScript (generated)
├── index.html          # Main HTML file
├── styles.css          # Dark theme styles
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Customization

### Update Personal Information

1. Edit `index.html` to replace placeholder text with your own:
   - Name and title
   - About section
   - Projects
   - Blog posts
   - Contact links

2. Update the logo in the sidebar (`yourname.dev`)

3. Replace project descriptions with your actual projects

### Customize Colors

Edit the CSS variables in `styles.css`:
```css
:root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #151515;
    --accent: #3b82f6;
    /* ... more colors */
}
```

### Add More Sections

1. Add a new section in `index.html`:
```html
<section id="newsection" class="section">
    <h2>New Section</h2>
    <!-- content -->
</section>
```

2. Add navigation link in the sidebar:
```html
<li><a href="#newsection" class="nav-link">New Section</a></li>
```

## Deployment

This is a static website that can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

Just upload the following files:
- `index.html`
- `styles.css`
- `dist/app.js`

## License

MIT License - feel free to use this for your own portfolio!

## Author

Built by a junior developer learning TypeScript
