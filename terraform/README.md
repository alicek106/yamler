# Yamler Terraform

## 웹사이트 배포

```bash
# 프로젝트 루트에서 실행
./deploy.sh

# 1. 빌드
npm run build

# 2. S3 업로드
aws s3 sync dist/ s3://yamler-alicek106-com --delete

# 3. CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id $(cd terraform && terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```
