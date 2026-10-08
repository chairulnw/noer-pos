# Dijalankan oleh self-hosted runner di PC server. Bisa juga manual: .\scripts\deploy.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Run($cmd) { Write-Host "> $cmd"; Invoke-Expression $cmd; if ($LASTEXITCODE -ne 0) { throw "Gagal: $cmd" } }

if (git status --porcelain --untracked-files=no) { throw "Ada perubahan lokal yang belum di-commit di folder server. Commit atau batalkan dulu." }

Run "git fetch origin main"
Run "git checkout main"
Run "git merge --ff-only origin/main"

New-Item -ItemType Directory -Force backups | Out-Null
$dump = "backups\pre-deploy-$(Get-Date -Format yyyyMMdd-HHmmss).dump"
cmd /c "docker compose exec -T db pg_dump -U pos -Fc pos > $dump"
if ($LASTEXITCODE -ne 0 -or (Get-Item $dump).Length -lt 1000) { throw "Backup database gagal, deploy dibatalkan." }
Get-ChildItem backups\pre-deploy-*.dump | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item

Run "docker compose build tools app"
Run "docker compose run --rm tools pnpm prisma migrate deploy"
Run "docker compose up -d app"
Write-Host "Deploy selesai."
