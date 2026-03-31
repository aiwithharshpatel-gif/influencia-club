@echo off
echo ========================================
echo   INFLUENZIA CLUB - Quick Start
echo ========================================
echo.

echo [1/5] Installing root dependencies...
call npm install

echo.
echo [2/5] Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [3/5] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. Configure your database:
echo    - Create MySQL database: influenzia
echo    - Update DATABASE_URL in backend\.env
echo.
echo 2. Set up environment variables:
echo    - Copy backend\.env.example to backend\.env
echo    - Copy frontend\.env.example to frontend\.env
echo    - Fill in your credentials
echo.
echo 3. Run database migrations:
echo    cd backend
echo    npx prisma migrate dev
echo.
echo 4. Start the application:
echo    npm run dev
echo.
echo ========================================
echo.

pause
