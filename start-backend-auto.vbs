' VBScript 无窗口启动后端
Set objShell = CreateObject("WScript.Shell")
strPath = objShell.CurrentDirectory
objShell.Run "powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & strPath & "\start-backend-auto.ps1""", 0, False
