@echo off
echo ================================
echo Chrome Extension Build Script
echo ================================
echo.

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 goto error

echo.
echo [2/3] Building extension...
call npm run build
if errorlevel 1 goto error

echo.
echo [3/3] Creating ZIP file...
call npm run zip
if errorlevel 1 goto error

echo.
echo ================================
echo BUILD SUCCESSFUL!
echo ================================
echo.
echo Extension built to: dist\
echo ZIP file created for Chrome Web Store
echo.
echo Next steps:
echo 1. Go to chrome://extensions/
echo 2. Enable "Developer mode"
echo 3. Click "Load unpacked"
echo 4. Select the "dist" folder
echo.
pause
goto end

:error
echo.
echo ================================
echo BUILD FAILED!
echo ================================
echo.
echo Please check the error messages above.
echo Common fixes:
echo - Run: npm install
echo - Delete node_modules and try again
echo - Check Node.js is installed: node --version
echo.
pause

:end
