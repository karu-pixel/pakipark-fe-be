$historyPath = "C:\Users\Juliana Mari Alejo\AppData\Roaming\Code\User\History"
if (Test-Path $historyPath) {
    Get-ChildItem -Path $historyPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
        # Check if the file contains the specific text we had in CustomerProfile.tsx (e.g., 'CustomerProfileProps')
        (Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) -match 'CustomerProfileProps'
    } | Select-Object -Property FullName, Length, LastWriteTime | Format-List
} else {
    Write-Host "VS Code History path not found!"
}
