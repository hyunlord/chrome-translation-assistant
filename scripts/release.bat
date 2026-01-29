@echo off
echo ================================
echo Create GitHub Release
echo ================================
echo.

REM Check if git is available
where git >nul 2>nul
if errorlevel 1 (
    echo Error: git is not installed or not in PATH
    pause
    exit /b 1
)

REM Get current version from package.json
for /f "tokens=2 delims=:, " %%a in ('findstr /r "\"version\"" package.json') do (
    set VERSION=%%a
)
set VERSION=%VERSION:"=%

echo Current version in package.json: %VERSION%
echo.
echo This will create a new release tag: v%VERSION%
echo.
set /p CONFIRM="Continue? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo Release cancelled.
    pause
    exit /b 0
)

echo.
echo [1/4] Building extension...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Creating ZIP file...
call npm run zip
if errorlevel 1 (
    echo ZIP creation failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Creating git tag...
git tag -a v%VERSION% -m "Release version %VERSION%"
if errorlevel 1 (
    echo Tag creation failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Pushing tag to GitHub...
git push origin v%VERSION%
if errorlevel 1 (
    echo Push failed! You may need to authenticate.
    pause
    exit /b 1
)

echo.
echo ================================
echo RELEASE CREATED SUCCESSFULLY!
echo ================================
echo.
echo Tag: v%VERSION%
echo.
echo GitHub Actions will now:
echo 1. Build the extension
echo 2. Create ZIP file
echo 3. Create GitHub Release
echo 4. Upload ZIP to releases
echo.
echo Check progress at: https://github.com/[YOUR-USERNAME]/chrome-translation-assistant/actions
echo.
pause
