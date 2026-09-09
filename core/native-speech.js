const { spawn } = require('child_process');
const WINDOWS_CULTURES=Object.freeze({en:'en-IN',hinglish:'en-IN',hi:'hi-IN',pa:'pa-IN',bn:'bn-IN',mr:'mr-IN',gu:'gu-IN',ta:'ta-IN',te:'te-IN',kn:'kn-IN',ml:'ml-IN',ur:'ur-IN'});
let activeProcess=null;
function listenWindows({language='en',timeoutSeconds=12}={}){if(process.platform!=='win32')return Promise.reject(new Error('Native Windows speech is only available on Windows.'));if(activeProcess)return Promise.reject(new Error('Microphone is already in use by KRITAM.'));const culture=WINDOWS_CULTURES[language]||'en-IN',timeout=Math.max(2,Math.min(30,Number(timeoutSeconds)||12));const script=`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$culture = [Globalization.CultureInfo]::GetCultureInfo($env:KRITAM_SPEECH_CULTURE)
$infos = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
$info = $infos | Where-Object { $_.Culture.Name -ieq $culture.Name } | Select-Object -First 1
if (-not $info) { $info = $infos | Where-Object { $_.Culture.TwoLetterISOLanguageName -ieq $culture.TwoLetterISOLanguageName } | Select-Object -First 1 }
if (-not $info) { $info = $infos | Where-Object { $_.Culture.TwoLetterISOLanguageName -ieq 'en' } | Select-Object -First 1 }
if (-not $info) { throw 'No compatible Windows speech recognizer is installed.' }
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($info)
$recognizer.SetInputToDefaultAudioDevice()
$recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
$result = $recognizer.Recognize([TimeSpan]::FromSeconds([double]$env:KRITAM_SPEECH_TIMEOUT))
if ($result) { [Console]::Out.Write($result.Text) }
$recognizer.Dispose()
`;
return new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',script],{windowsHide:true,env:{...process.env,KRITAM_SPEECH_CULTURE:culture,KRITAM_SPEECH_TIMEOUT:String(timeout)}});activeProcess=child;let stdout='',stderr='',settled=false;const finish=(fn,value)=>{if(settled)return;settled=true;if(activeProcess===child)activeProcess=null;fn(value);};child.stdout.on('data',chunk=>stdout+=chunk.toString());child.stderr.on('data',chunk=>stderr+=chunk.toString());child.on('error',error=>finish(reject,new Error(`Windows speech could not start: ${error.message}`)));child.on('close',code=>{const text=stdout.trim();if(code===0&&text)return finish(resolve,{text,language:culture});if(code===0)return finish(reject,new Error('I didn’t catch that. Please try again.'));finish(reject,new Error(stderr.trim()||'Windows speech recognition stopped before a clear phrase was heard.'));});});}
function cancelWindowsSpeech(){if(!activeProcess)return false;const child=activeProcess;activeProcess=null;try{child.kill();}catch(_){}return true;}
module.exports={listenWindows,cancelWindowsSpeech,WINDOWS_CULTURES};
