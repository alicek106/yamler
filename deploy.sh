#!/bin/bash
set -e

echo "🚀 Building Yamler..."
npm run build

echo ""
echo "📦 Deploying to S3..."
BUCKET_NAME=$(cd terraform && terraform output -raw s3_bucket_name)
aws s3 sync dist/ "s3://${BUCKET_NAME}" --delete

echo ""
echo "🔄 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(cd terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"

echo ""
echo "✅ Deployment complete!"
WEBSITE_URL=$(cd terraform && terraform output -raw website_url)
echo "🌐 Website: ${WEBSITE_URL}"
