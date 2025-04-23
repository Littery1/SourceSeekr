#!/bin/bash

# Ensure Prisma client is correctly generated for Vercel deployment
echo "Ensuring all files are updated for deployment..."

# Make sure we have the production environment set up
if [ ! -f ".env.production" ]; then
  echo "Creating .env.production file..."
  cat > .env.production << EOL
AUTH_GITHUB_ID=Ov23liiAOBk4wTcj9yoL
AUTH_GITHUB_SECRET=cc5a49fa4d9783877b6350e75ae2bda641653552
AUTH_SECRET=0d16dea431e5c3367e65e47dcc429b2f324365f89823b34ce15ec74e3d1b93f0
NEXTAUTH_URL=https://sourceseekr-copy.vercel.app
NEXT_PUBLIC_APP_URL=https://sourceseekr-copy.vercel.app
EOL
  echo ".env.production created"
fi

# Run Prisma generate to ensure client is updated
echo "Running prisma generate..."
npx prisma generate

# Deploy to Vercel
echo "Deploying to Vercel..."
npx vercel --prod

echo "Deployment completed!"