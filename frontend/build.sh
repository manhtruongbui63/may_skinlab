#!/bin/bash

# Tên image
IMAGE_NAME="next-app"

# Load biến môi trường từ file .env nếu có
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Đang xây dựng Docker image: $IMAGE_NAME..."

# Build image với các build-args (quan trọng cho Next.js NEXT_PUBLIC_ variables)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
  --build-arg NEXT_PUBLIC_USE_MOCK=$NEXT_PUBLIC_USE_MOCK \
  --build-arg NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
  -t $IMAGE_NAME .

echo "✅ Build hoàn tất!"
echo "👉 Chạy lệnh sau để khởi động container:"
echo "docker run -p 3000:3000 $IMAGE_NAME"
