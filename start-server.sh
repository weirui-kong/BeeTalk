#!/bin/bash

# Check if update-dns.cjs exists and execute it
if [ -f "BeeTalkServer/update-dns.cjs" ]; then
    echo "Executing update-dns.cjs..."
    node BeeTalkServer/update-dns.cjs
fi

# Build the web application
echo "Building BeeTalkWeb..."
cd BeeTalkWeb
npm run build

# Copy dist folder to server src directory
echo "Copying dist to server src..."
cp -r dist/* ../BeeTalkServer/public/

# Start the server
echo "Starting server..."
cd ../BeeTalkServer/src
node server.js 