# Hotel Satyam Booking System

A mobile-first, lightweight React application for hotel bookings.

## Setup & Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## Configuration

Customize the application by editing `src/config.js`. You can update:
- Brand Name (Hotel Satyam)
- Contact Info (Phone, Email, Address)
- Room Types & Prices
- Amenities

The entire app updates dynamically based on this config.

## Deployment to Cloudflare Pages

1. Build the project:
   ```bash
   npm run build
   ```
   This generates the `dist/` folder.
2. Deploy the `dist/` folder to Cloudflare Pages.
   - The `public/_redirects` file ensures SPA routing works correctly on Cloudflare Pages.

## Future Enhancements
- `wrangler.toml` for Workers backend.
- Replace mock backend implementations in `src/api.js` with real API calls using Hono + Cloudflare D1.
