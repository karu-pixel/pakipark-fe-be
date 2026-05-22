Get-ChildItem -Path 'c:\Users\Juliana Mari Alejo\Downloads' -Filter 'CustomerProfile.tsx' -Recurse -ErrorAction SilentlyContinue | Select-Object -Property FullName, Length
