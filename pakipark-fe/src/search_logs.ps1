$logPath = "C:\Users\Juliana Mari Alejo\.gemini\antigravity\brain\28e6875b-ee1c-45dc-b7f7-ad963ba8dcdf\.system_generated\logs\overview.txt"
if (Test-Path $logPath) {
    Get-Content $logPath | Where-Object { $_ -like '*CustomerProfile.tsx*' } | Select-Object -First 20
} else {
    Write-Host "Log not found!"
}
