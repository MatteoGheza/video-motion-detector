const { exec } = require('child_process');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

/*
const ffmpegPath = require('ffmpeg-static').replace(
  'app.asar',
  'app.asar.unpacked'
);
const ffprobePath = require('ffprobe-static').path.replace(
  'app.asar',
  'app.asar.unpacked'
);
*/
const ffmpegPath = require('ffmpeg-static-electron').path.replace("app.asar","app.asar.unpacked");
const ffprobePath = require('ffprobe-static-electron').path.replace("app.asar","app.asar.unpacked");;

function getFramesCount(videoPath){
  let process = exec(`${ffprobePath} -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 ${videoPath}`);
  process.stdout.on('data', (data) => {
    postMessage({
      type: 'frames_count',
      frames_count: data.trim().replace("\\r\\n", "").replace("\\n", "")
    });
  });
}

//ffmpeg -loglevel 31 -i "test.mp4" -vf select='gte(scene\,0)',metadata=print:file=scenescores_ultrapreciso.txt -an -f null -
function runProcessing(videoPath){
  let metadataCode = nanoid();

  let process = exec(`${ffmpegPath} -i ${videoPath} -vf select='gte(scene\,0)',metadata=print:file=scenescores_${metadataCode}.txt -an -f null -`, {
    cwd: 'C:\\Users\\ardui\\progetti\\video-motion-detector\\tmp'
  });

  process.stdout.on('data', (data) => {
    postMessage({
      type: 'stdout',
      data: data
    });
    console.log(`stdout: ${data}`);
  });
  
  process.stderr.on('data', (data) => {
    let frame = "";
    let speed = "";
    try {
      frame = data.split("frame=")[1].split(" fps=")[0].trim();
      speed = data.split("speed=")[1].trim().split(" ")[0];
    } catch(e) {}
    postMessage({
      type: 'stderr',
      data: data,
      frame: frame,
      speed: speed
    });
    console.log(`frame: ${frame} - speed: ${speed} - stdout: ${data}`);
  });
  
  process.on('close', (code) => {
    postMessage({
      type: 'ffmpeg_close',
      code: code,
      metadataCode: metadataCode
    });
    console.log(`child process exited with code ${code}`);
  });
}

function parseMetadata(metadataCode){
  if(metadataCode !== undefined) {
    let metadata = [];

    let previousLine = "";
    const fileStream = fs.createReadStream(path.join('C:\\Users\\ardui\\progetti\\video-motion-detector\\tmp', `scenescores_${metadataCode}.txt`));

    console.log(`parsing metadata for ${metadataCode}`);
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    console.log("OK", rl);
    rl.on("line", (line) => {
      //Read two lines at time
      if (!previousLine) {
        // no previous line to compare to, so just remember this line
        previousLine = line;
      } else {
        line = previousLine + " " + line;
        console.log(line);
        metadata.push({
          frame: line.split("frame:")[1].split(" ")[0].trim(),
          pts: line.split("pts:")[1].split(" ")[0].trim(),
          pts_time: line.split("pts_time:")[1].split(" ")[0].trim(),
          scene_score: line.split("scene_score=")[1].split(" ")[0].trim()
        });
        previousLine = "";
      }
    });

    rl.on("close", () => {
      postMessage({
        type: 'metadata',
        metadata: metadata
      });
    });
  }
}

try{
  addEventListener('message', ({ data }) => {
    console.log(data)
    switch (data.command) {
      case "start":
        runProcessing(data.videoPath);
        break;
      
      case "frames_count":
        getFramesCount(data.videoPath);
    
      case "parse_metadata":
        parseMetadata(data.metadataCode);
        break;

      default:
        break;
    }
  });
} catch(e) { }
