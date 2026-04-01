# 启动脚本 - 同时启动前端和后端服务

Write-Host "Starting Shiwuji services..."

# 启动后端服务
Write-Host "Starting backend service..."
Start-Process powershell -ArgumentList "cd 'e:\大学\item-manager-backend'; npm start" -WindowStyle Minimized

# 等待后端服务启动
Write-Host "Waiting for backend service to start..."
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "Starting frontend service..."
Start-Process powershell -ArgumentList "cd 'e:\大学\item-manager-page-three'; python -m http.server 8000" -WindowStyle Minimized

# 等待前端服务启动
Start-Sleep -Seconds 2

Write-Host "Services started successfully!"
Write-Host "Frontend: http://localhost:8000"
Write-Host "Backend: http://localhost:3000"
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')