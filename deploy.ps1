# Run this script to deploy the application manually.
# Since the automated browser login timed out, this will allow you to authenticate 
# through your local machine's default browser directly.

cd C:\Users\rakes\.gemini\antigravity-ide\scratch\hotel-satyam-booking

# Clean any stale wrangler state that might be causing the timeout
Remove-Item -Path "$env:APPDATA\xdg.config\.wrangler" -Recurse -ErrorAction SilentlyContinue

# Attempt to deploy to Cloudflare Pages again
npx wrangler pages deploy dist --project-name hotel-satyam-booking
