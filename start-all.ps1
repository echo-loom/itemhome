# 启动脚本 - 同时启动前端和后端服务

Write-Host "正在启动拾物集服务..."

# 启动后端服务
Write-Host "启动后端服务..."
Start-Process powershell -ArgumentList "cd 'e:\大学\item-manager-backend'; npm start" -WindowStyle Minimized

# 等待后端服务启动
Write-Host "等待后端服务启动..."
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "启动前端服务..."
Start-Process powershell -ArgumentList "cd 'e:\大学\item-manager-page-three'; python -m http.server 8000" -WindowStyle Minimized

# 等待前端服务启动
Start-Sleep -Seconds 2

Write-Host "服务启动完成！"
Write-Host "前端地址: http://localhost:8000"
Write-Host "后端地址: http://localhost:3000"
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')