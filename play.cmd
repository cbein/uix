@echo off
setlocal

set "MOD_ROOT=%~dp0"
set "DEFAULT_GAME_EXE=%MOD_ROOT%..\..\..\Mindustry.exe"

if defined MINDUSTRY_EXE (
    set "GAME_EXE=%MINDUSTRY_EXE%"
) else (
    set "GAME_EXE=%DEFAULT_GAME_EXE%"
)

if not exist "%GAME_EXE%" (
    echo Mindustry executable not found. Set MINDUSTRY_EXE to your Mindustry executable path, then run this script again.
    exit /b 1
)

start "" "%GAME_EXE%"
