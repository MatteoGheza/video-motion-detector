import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FileSelectorService } from 'src/app/_services/file-selector.service';

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit {
  public playVideo: boolean = false;
  public videoUrl: string = '';
  
  public filePath: string = '';
  public framesCount: number = 100;
  public currentProcessedFrame: number = 0;
  public processProgress = "0%";

  public status: string = 'Idle';
  public metadata: any[] = [];
  public metadataLoaded: boolean = false;
  public sceneScore: number = 0;

  constructor(public fileSelectorService: FileSelectorService, private ref: ChangeDetectorRef) { }

  setStatus(status: string) {
    if(this.status !== status) {
      this.status = status;
      this.ref.detectChanges();
    }
  }

  resetStatus() {
    this.status = 'Idle';
    this.ref.detectChanges();
  }

  selectVideo() {
    this.setStatus("Waiting video selection...");
    this.fileSelectorService.selectVideo().then((file: string) => {
      console.log(file);
      this.videoUrl = "file://"+file;
      this.filePath = file;
      this.playVideo = true;
      this.resetStatus();
    });
  }

  ffmpegProcess() {
    this.setStatus("Starting web worker...");
    const worker = new Worker('../../../assets/ffmpeg-process.worker.js');
    worker.onmessage = ({ data }) => {
      console.log('page got message', data);
      console.log(this.status);
      if(data.type === "frames_count"){
        console.log(data);
        this.framesCount = data.frames_count;
        worker.postMessage({ "command": "start", "videoPath": this.filePath});
      }
      if(data.type === "stderr"){
        this.setStatus("Processing video...");
        this.currentProcessedFrame = data.frame;
        let progress = Math.round(100*this.currentProcessedFrame/this.framesCount);
        if(progress > parseInt(this.processProgress.replace("%",""))){
          this.processProgress = progress+"%";
          this.ref.detectChanges();
        }
      }
      if(data.type === "ffmpeg_close"){
        this.setStatus("Parsing metadata...");
        worker.postMessage({ "command": "parse_metadata", "metadataCode": data.metadataCode});
      }
      if(data.type === "metadata"){
        this.metadataLoaded = true;
        this.metadata = data.metadata;
        this.setStatus("Parsing metadata... DONE!");
        worker.terminate();
        console.log(this.extractMotionList(this.metadata));
        this.resetStatus();
      }
    };
    worker.postMessage({ "command": "frames_count", "videoPath": this.filePath});
  }

  extractMotionList(metadata: any[]) {
    function motionDetected(sceneScore: number) {
      return sceneScore > 0.01;
    }

    let motion = [
      {motion: true, time: 0},
      {motion: false, time: 0}
    ];

    let previousTime = 0;
    metadata.forEach((obj) => {
      if(motionDetected(obj.scene_score)) {
        motion[0].time += obj.pts_time - previousTime;
      } else {
        motion[1].time += obj.pts_time - previousTime;
      }
      previousTime = obj.pts_time;
    });
    return motion;
  }

  videoTimeUpdate(event: Event) {
    if(this.metadataLoaded) {
      let video = document.getElementsByTagName("video")[0];
      video.addEventListener('timeupdate', (event) => {
        this.sceneScore = this.metadata.find((obj) => { return obj.pts_time- (<HTMLVideoElement>event.target).currentTime > 0.02; }).scene_score;
      });
    }
  }

  ngOnInit(): void {
  }

}
