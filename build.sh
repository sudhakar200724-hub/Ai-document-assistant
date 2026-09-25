#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Building React frontend with Vite..."
cd frontend
npm install
npm run build
cd ..

echo "==> Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "==> Production build completed successfully!"
