@echo off
git add .
set /p msg="What did you do today? "
git commit -m "%USERNAME%: %msg%"
git push
echo.
echo All done! PR link:
git config --get remote.origin.url | sed "s/git@/https:\/\//" | sed "s/.git$/\/compare\/main...%USERNAME%-%msg: =-% | tr " " "-"
echo (or just go to GitHub and click Pull Requests)
pause