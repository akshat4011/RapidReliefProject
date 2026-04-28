@echo off
cd /d "%~dp0"
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "SERVER_PORT=8081"
"%JAVA_HOME%\bin\java.exe" -Dserver.port=%SERVER_PORT% -jar target\medical-crisis-response-1.0.0.jar
pause
