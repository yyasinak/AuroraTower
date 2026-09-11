$ErrorActionPreference='Stop'
$project=Split-Path $PSScriptRoot -Parent
$sdk=Join-Path $env:LOCALAPPDATA 'Android/Sdk'
$buildTools=Join-Path $sdk 'build-tools/36.0.0'
$jdk='C:/Program Files/Java/jdk-21'
$android=Join-Path $sdk 'platforms/android-35/android.jar'
$out=Join-Path $PSScriptRoot 'build'
New-Item -ItemType Directory -Force "$out/assets/assets/audio","$out/classes","$out/dex" | Out-Null
Copy-Item "$project/index.html","$project/game.js","$project/music.js","$project/mobile-input.js" "$out/assets/"
Copy-Item "$project/assets/audio/stayin-alive.mp3" "$out/assets/assets/audio/"
function Check {if($LASTEXITCODE -ne 0){throw "Build failed ($LASTEXITCODE)"}}
& "$buildTools/aapt.exe" package -f -M "$PSScriptRoot/AndroidManifest.xml" -I $android -A "$out/assets" -F "$out/base.apk"; Check
& "$jdk/bin/javac.exe" -encoding UTF-8 -source 8 -target 8 -bootclasspath $android -d "$out/classes" "$PSScriptRoot/MainActivity.java"; Check
$classes=@(Get-ChildItem "$out/classes" -Recurse -Filter '*.class' | ForEach-Object {$_.FullName})
& "$buildTools/d8.bat" --lib $android --min-api 26 --output "$out/dex" @classes; Check
Copy-Item "$out/base.apk" "$out/unsigned.apk" -Force
Push-Location "$out/dex"
try{& "$buildTools/aapt.exe" add "$out/unsigned.apk" classes.dex; Check}finally{Pop-Location}
& "$buildTools/zipalign.exe" -f 4 "$out/unsigned.apk" "$out/aligned.apk"; Check
if(!(Test-Path "$out/local-signing.jks")){
 & "$jdk/bin/keytool.exe" -genkeypair -keystore "$out/local-signing.jks" -storepass android -keypass android -alias aurora -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Aurora Tower Local'; Check
}
& "$buildTools/apksigner.bat" sign --ks "$out/local-signing.jks" --ks-pass pass:android --key-pass pass:android --out "$out/AuroraTower.apk" "$out/aligned.apk"; Check
& "$buildTools/apksigner.bat" verify "$out/AuroraTower.apk"; Check
Write-Output "APK: $out/AuroraTower.apk"
