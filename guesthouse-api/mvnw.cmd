@REM ---------------------------------------------------------------------------
@REM  Maven bootstrapper for guesthouse-api  (Windows cmd / PowerShell)
@REM
@REM  Order of preference:
@REM    1. A Maven already on PATH or pointed at by MAVEN_HOME  -> use it
@REM    2. Otherwise download the distribution named in
@REM       .mvn\wrapper\maven-wrapper.properties into %USERPROFILE%\.m2\wrapper
@REM
@REM  This is the "only-script" wrapper style, so no maven-wrapper.jar is
@REM  committed. Once Maven is installed you can regenerate the official
@REM  upstream scripts with:  mvn wrapper:wrapper -Dmaven=3.9.9
@REM
@REM  Usage:  .\mvnw.cmd spring-boot:run
@REM ---------------------------------------------------------------------------
@echo off
setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "PROPS=%SCRIPT_DIR%.mvn\wrapper\maven-wrapper.properties"

@REM ----------------------------------------------------------- Java check
set "JAVA_EXE="
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
)
if not defined JAVA_EXE (
    where java >nul 2>nul
    if errorlevel 1 (
        echo.
        echo [mvnw] ERROR: No Java found. Install JDK 21 and set JAVA_HOME.
        echo [mvnw]        See ..\docs\local-setup.md for instructions.
        echo.
        exit /b 1
    )
    set "JAVA_EXE=java"
)

@REM Refuse to run on anything older than 21. "java -version" prints to stderr.
for /f "usebackq tokens=3" %%v in (`""%JAVA_EXE%" -version 2>&1 | findstr /i "version""`) do (
    set "RAW_VER=%%~v"
    goto :gotver
)
:gotver
for /f "delims=. tokens=1" %%m in ("!RAW_VER!") do set "JAVA_MAJOR=%%m"
if defined JAVA_MAJOR (
    if !JAVA_MAJOR! LSS 21 (
        echo.
        echo [mvnw] ERROR: Java 21 or later is required, but found version !RAW_VER!
        echo [mvnw]        Install Eclipse Temurin 21:
        echo [mvnw]            winget install EclipseAdoptium.Temurin.21.JDK
        echo [mvnw]        then set JAVA_HOME to its install folder.
        echo [mvnw]        See ..\docs\local-setup.md.
        echo.
        exit /b 1
    )
)

@REM ------------------------------------------------ 1. Use installed Maven
if defined MAVEN_HOME (
    if exist "%MAVEN_HOME%\bin\mvn.cmd" (
        call "%MAVEN_HOME%\bin\mvn.cmd" %*
        exit /b !ERRORLEVEL!
    )
)
where mvn >nul 2>nul
if not errorlevel 1 (
    call mvn %*
    exit /b !ERRORLEVEL!
)

@REM ------------------------------------------------ 2. Bootstrap a copy
if not exist "%PROPS%" (
    echo [mvnw] ERROR: Missing %PROPS%
    exit /b 1
)

set "DIST_URL="
for /f "usebackq tokens=1,* delims==" %%a in ("%PROPS%") do (
    if /i "%%a"=="distributionUrl" set "DIST_URL=%%b"
)
if not defined DIST_URL (
    echo [mvnw] ERROR: distributionUrl is not set in %PROPS%
    exit /b 1
)

for %%f in ("%DIST_URL%") do set "DIST_ZIP=%%~nxf"
set "DIST_NAME=%DIST_ZIP:-bin.zip=%"
set "WRAPPER_HOME=%USERPROFILE%\.m2\wrapper\dists"
set "MAVEN_DIR=%WRAPPER_HOME%\%DIST_NAME%"

if not exist "%MAVEN_DIR%\bin\mvn.cmd" (
    echo [mvnw] Maven is not installed on this machine.
    echo [mvnw] Downloading %DIST_ZIP%
    echo [mvnw]   from %DIST_URL%
    echo [mvnw]   into %MAVEN_DIR%
    echo [mvnw] ^(one-off, about 9 MB; or run "winget install Apache.Maven" to skip this^)

    if not exist "%WRAPPER_HOME%" mkdir "%WRAPPER_HOME%"
    set "TMP_ZIP=%TEMP%\%DIST_ZIP%"
    set "TMP_OUT=%TEMP%\mvnw-extract-%RANDOM%"

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ErrorActionPreference='Stop';" ^
        "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
        "Invoke-WebRequest -Uri '%DIST_URL%' -OutFile '!TMP_ZIP!' -UseBasicParsing;" ^
        "New-Item -ItemType Directory -Force -Path '!TMP_OUT!' | Out-Null;" ^
        "Expand-Archive -LiteralPath '!TMP_ZIP!' -DestinationPath '!TMP_OUT!' -Force;"
    if errorlevel 1 (
        echo.
        echo [mvnw] ERROR: Download or extraction failed.
        echo [mvnw]        Check your internet connection, or install Maven yourself:
        echo [mvnw]            winget install Apache.Maven
        echo.
        exit /b 1
    )

    if not exist "!TMP_OUT!\%DIST_NAME%\bin\mvn.cmd" (
        echo [mvnw] ERROR: Unexpected archive layout in !TMP_OUT!
        exit /b 1
    )

    if exist "%MAVEN_DIR%" rmdir /s /q "%MAVEN_DIR%"
    move "!TMP_OUT!\%DIST_NAME%" "%MAVEN_DIR%" >nul
    rmdir /s /q "!TMP_OUT!" 2>nul
    del /q "!TMP_ZIP!" 2>nul
    echo [mvnw] Maven ready at %MAVEN_DIR%
)

call "%MAVEN_DIR%\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%
