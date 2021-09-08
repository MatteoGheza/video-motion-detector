import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FileSelectorService } from 'src/app/_services/file-selector.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit {
  public eel: any;

  public playVideo: boolean = false;
  public videoUrl: string = '';
  public videoDuration: number = 0;
  
  public videoId: string = '';
  public filePath: string = '';
  public framesCount: number = 100;
  public framerate: number = 0;
  public currentProcessedFrame: number = 0;
  public processProgress = "0%";

  public status: string = 'Idle';
  public metadata: any[] = [];
  public metadataLoaded: boolean = false;
  public sceneScore: number = 0;

  public motionStatsLoaded: boolean = false;
  public motionCount: number = 0;
  public motionSegments: number = 0;
  public noMotionCount: number = 0;
  public noMotionSegments: number = 0;

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

  constructor(
    public fileSelectorService: FileSelectorService,
    private ref: ChangeDetectorRef,
    private http: HttpClient
  ) {
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
        this.framerate = response.framerate;
      });
    });
  }

  loadffmpegMetadata() {
    this.setStatus("Loading metadata...");
    this.http.get<any>('http://localhost:8000/ffmpeg_metadata/'+this.videoId).subscribe(data => {
      this.metadata = data.data;
      this.metadataLoaded = true;
      this.resetStatus();
      console.log(this.metadata);
      this.extractMotionList();
    })
  }

  ffmpegProcess() {
    this.metadataLoaded = false;
    this.motionStatsLoaded = false;
    this.currentProcessedFrame = 0;
    this.processProgress = "0%";
    this.setStatus("Starting video processing...");
    this.eel.python_process_video_ffmpeg(this.videoId)((response: any) => {
      this.resetStatus();
      this.currentProcessedFrame = 0;
      this.processProgress = "0%";
      this.loadffmpegMetadata();
    });
  }

  opencv2Process() {
    this.metadataLoaded = false;
    this.motionStatsLoaded = false;
    this.currentProcessedFrame = 0;
    this.processProgress = "0%";
    this.setStatus("Starting video processing...");
    this.eel.python_process_video_opencv2(this.videoId)((response: any) => {
      this.resetStatus();
      this.currentProcessedFrame = 0;
      this.processProgress = "0%";
      this.metadata = response.metadata;
      this.metadataLoaded = true;
      this.resetStatus();
      console.log(this.metadata);
      this.extractMotionList();
    });
  }

  extractMotionList() {
    function motionDetected(sceneScore: number) {
      return sceneScore > 0.008;
    }

    let videoElement = document.getElementsByTagName("video")[0];
    this.videoDuration = videoElement.duration;

    let lastFramesWithMotion: number;
    let lastFrameHasMotion: boolean;
    let lastFramesWithNoMotion: number;
    let lastFrameHasNoMotion: boolean;
    
    lastFramesWithMotion = 0;
    lastFrameHasMotion = false;
    lastFramesWithNoMotion = 0;
    lastFrameHasNoMotion = false;

    this.metadata.forEach((val: any) => {
        //console.log(motionDetected(val.scene_score));
        if (motionDetected(val.scene_score)) {
            if (lastFrameHasNoMotion) {
                if (lastFramesWithNoMotion > 20) {
                    this.noMotionSegments++;
                    this.noMotionCount += lastFramesWithNoMotion;
                }
            }
            lastFrameHasMotion = true;
            lastFramesWithMotion++;
            lastFrameHasNoMotion = false;
            lastFramesWithNoMotion = 0;
        } else {
            if (lastFrameHasMotion) {
                if (lastFramesWithMotion > 20) {
                    this.motionSegments++;
                    this.motionCount += lastFramesWithMotion;
                }
            }
            lastFrameHasNoMotion = true;
            lastFramesWithNoMotion++;
            lastFrameHasMotion = false;
            lastFramesWithMotion = 0;
        }
    });
    this.motionStatsLoaded = true;
    this.ref.detectChanges();
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
