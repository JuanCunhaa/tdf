Get-Content frontend/src/pages/user/Dashboard.tsx -Raw | % { [Text.Encoding]::UTF8.GetString([Text.Encoding]::Default.GetBytes()) }
