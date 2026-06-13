@echo off
set IMAGE_NAME=next-app

echo 🚀 Dang xay dung Docker image: %IMAGE_NAME%...

:: Lay cac bien tu .env (Luu y: phai tu dien vao day neu can build local tren Windows batch)
:: Hoac ban co the su dung Docker Desktop build.

docker build ^
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3000/api ^
  --build-arg NEXT_PUBLIC_USE_MOCK=true ^
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 ^
  -t %IMAGE_NAME% .

echo ✅ Build hoan tat!
echo 👉 Chay lenh sau de khoi dong container:
echo docker run -p 3000:3000 %IMAGE_NAME%
pause
