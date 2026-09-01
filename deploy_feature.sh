#!/bin/bash
set -e

COMMIT_MSG="${1:-feat: cleanly decouple clinical tests and therapeutic exercises bank}"

echo "=========================================="
echo "🚀 PsyPro Safe Feature Deployment Pipeline"
echo "=========================================="

echo "1. Staging and committing on active feature branch..."
git add .
git commit -m "$COMMIT_MSG" || true

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "2. Pushing feature branch to origin..."
    git push origin "$CURRENT_BRANCH" || true

    echo "3. Switching to master branch..."
    git checkout master
    git pull origin master || true

    echo "4. Merging $CURRENT_BRANCH into master..."
    git merge "$CURRENT_BRANCH"
fi

echo "5. Flushing and optimizing Laravel Backend cache..."
cd backend
chmod -R 775 storage bootstrap/cache
php artisan optimize:clear

echo "6. Compiling Frontend production bundle..."
cd ../frontend
npm run build

echo "7. Restarting PM2 process manager..."
pm2 restart all
sleep 3
pm2 status

echo "8. Pushing updated master to GitHub backup..."
cd ..
git push origin master

echo "=========================================="
echo "✅ Deployment completed successfully 100%!"
echo "=========================================="
