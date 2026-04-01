# 自动启动后端脚本 - 无窗口运行

# 获取脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"

# 检查后端目录是否存在
if (-not (Test-Path $backendPath)) {
    Write-Host "错误：后端目录不存在：$backendPath"
    exit 1
}

# 启动后端服务（无窗口）
Write-Host "正在启动后端服务..."
Start-Process powershell -ArgumentList "-NoProfile -WindowStyle Hidden -Command `"Set-Location '$backendPath'; npm start`"" -WindowStyle Hidden

Write-Host "后端服务已启动！"
