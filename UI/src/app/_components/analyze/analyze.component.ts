import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FileSelectorService } from 'src/app/_services/file-selector.service';

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit {
  public eel: any;

  public playVideo: boolean = false;
  public videoUrl: string = '';
  
  public videoId: string = '';
  public filePath: string = '';
  public framesCount: number = 100;
  public currentProcessedFrame: number = 0;
  public processProgress = "0%";

  public status: string = 'Idle';
  public metadata: any[] = [];
  public metadataLoaded: boolean = false;
  public sceneScore: number = 0;

  public motionList: any[] = [];
  public motionListLoaded: boolean = false;

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

  @HostListener('document:processProgressUpdate', ['$event'])
  processProgressUpdate(event: any) {
    let frame: number = event.detail.frame;
    let speed: number = event.detail.speed;
    console.log(frame, speed);
    this.setStatus("Processing video...");
    this.currentProcessedFrame = frame;
    let progress = Math.round(100*this.currentProcessedFrame/this.framesCount);
    if(progress > parseInt(this.processProgress.replace("%",""))){
      this.processProgress = progress+"%";
      this.ref.detectChanges();
    }
  }

  emitProcessProgressUpdateEvent(frame: number, speed: string) {
    const event = new CustomEvent('processProgressUpdate', { detail: { frame: frame, speed: speed } });
    document.dispatchEvent(event);
  }

  constructor(public fileSelectorService: FileSelectorService, private ref: ChangeDetectorRef) {
    this.eel = (window as any).eel;
    this.eel.expose(this.emitProcessProgressUpdateEvent, 'processProgressUpdate');
  }

  selectVideo() {
    this.setStatus("Waiting video selection...");
    this.fileSelectorService.selectVideo().then((response) => {
      console.log(response);
      this.filePath = response.filePath;
      this.videoId = response.id;
      this.videoUrl = "http://localhost:8000/video/" + this.videoId;
      this.playVideo = true;
      this.resetStatus();
      this.eel.python_get_video_frames(this.videoId)((response: any) => {
        console.log(response);
        this.framesCount = response.framesCount;
      });
    });
  }

  ffmpegProcess() {
    this.setStatus("Starting video processing...");
    this.eel.python_process_video_ffmpeg(this.videoId)((response: any) => {
      this.resetStatus();
      this.currentProcessedFrame = 0;
      this.processProgress = "0%";
    });
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