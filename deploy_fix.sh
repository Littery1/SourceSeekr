#!/bin/bash

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the application
echo "Building the application..."
npm run build

# If you're using Vercel for deployment
echo "Deploying to Vercel..."
npx vercel --prod

echo "Deployment complete!"