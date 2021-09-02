import { Component, OnInit } from '@angular/core';
import { FileSelectorService } from 'src/app/_services/file-selector.service';

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit {
  public playVideo: boolean = false;
  public videoUrl: string = 'https://shattereddisk.github.io/rickroll/rickroll.mp4';
  
  public filePath: string = '';

  public metadata: any[] = [];
  public metadataLoaded: boolean = false;
  public sceneScore: number = 0;

  constructor(public fileSelectorService: FileSelectorService) { }

  selectVideo() {
    console.log('select video');
    this.fileSelectorService.selectVideo().then((file: string) => {
      console.log(file);
      this.videoUrl = "file://"+file;
      this.filePath = file;
      this.playVideo = true;
    });
  }

  ffmpegProcess() {
    const worker = new Worker('../../../assets/ffmpeg-process.worker.js');
    worker.onmessage = ({ data }) => {
      console.log('page got message', data);
      if(data.type === "ffmpeg_close"){
        worker.postMessage({ "command": "parse_metadata", "metadataCode": data.metadataCode});
      }
      if(data.type === "metadata"){
        this.metadataLoaded = true;
        this.metadata = data.metadata;
        worker.terminate();
      }
    };
    worker.postMessage({ "command": "start", "videoPath": this.filePath});
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
