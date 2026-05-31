Get-ChildItem -Path 'C:\Users\Juliana Mari Alejo\.gemini\antigravity' -Filter '*CustomerProfile*' -Recurse -ErrorAction SilentlyContinue | Select-Object -Property FullName, Length | Format-List
