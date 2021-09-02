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

  public motionList: any[] = [];
  public motionListLoaded: boolean = false;

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
    let response = atob("Y29uc3QgeyBleGVjIH0gPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJyk7CmNvbnN0IHsgbmFub2lkIH0gPSByZXF1aXJlKCduYW5vaWQnKTsKY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTsKY29uc3QgZnMgPSByZXF1aXJlKCdmcycpOwpjb25zdCByZWFkbGluZSA9IHJlcXVpcmUoJ3JlYWRsaW5lJyk7CgovKgpjb25zdCBmZm1wZWdQYXRoID0gcmVxdWlyZSgnZmZtcGVnLXN0YXRpYycpLnJlcGxhY2UoCiAgJ2FwcC5hc2FyJywKICAnYXBwLmFzYXIudW5wYWNrZWQnCik7CmNvbnN0IGZmcHJvYmVQYXRoID0gcmVxdWlyZSgnZmZwcm9iZS1zdGF0aWMnKS5wYXRoLnJlcGxhY2UoCiAgJ2FwcC5hc2FyJywKICAnYXBwLmFzYXIudW5wYWNrZWQnCik7CiovCmNvbnN0IGZmbXBlZ1BhdGggPSByZXF1aXJlKCdmZm1wZWctc3RhdGljLWVsZWN0cm9uJykucGF0aC5yZXBsYWNlKCJhcHAuYXNhciIsImFwcC5hc2FyLnVucGFja2VkIik7CmNvbnN0IGZmcHJvYmVQYXRoID0gcmVxdWlyZSgnZmZwcm9iZS1zdGF0aWMtZWxlY3Ryb24nKS5wYXRoLnJlcGxhY2UoImFwcC5hc2FyIiwiYXBwLmFzYXIudW5wYWNrZWQiKTs7CgpmdW5jdGlvbiBnZXRGcmFtZXNDb3VudCh2aWRlb1BhdGgpewogIGxldCBwcm9jZXNzID0gZXhlYyhgJHtmZnByb2JlUGF0aH0gLXYgZXJyb3IgLXNlbGVjdF9zdHJlYW1zIHY6MCAtY291bnRfcGFja2V0cyAtc2hvd19lbnRyaWVzIHN0cmVhbT1uYl9yZWFkX3BhY2tldHMgLW9mIGNzdj1wPTAgJHt2aWRlb1BhdGh9YCk7CiAgcHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YSkgPT4gewogICAgcG9zdE1lc3NhZ2UoewogICAgICB0eXBlOiAnZnJhbWVzX2NvdW50JywKICAgICAgZnJhbWVzX2NvdW50OiBkYXRhLnRyaW0oKS5yZXBsYWNlKCJcXHJcXG4iLCAiIikucmVwbGFjZSgiXFxuIiwgIiIpCiAgICB9KTsKICB9KTsKfQoKLy9mZm1wZWcgLWxvZ2xldmVsIDMxIC1pICJ0ZXN0Lm1wNCIgLXZmIHNlbGVjdD0nZ3RlKHNjZW5lXCwwKScsbWV0YWRhdGE9cHJpbnQ6ZmlsZT1zY2VuZXNjb3Jlc191bHRyYXByZWNpc28udHh0IC1hbiAtZiBudWxsIC0KZnVuY3Rpb24gcnVuUHJvY2Vzc2luZyh2aWRlb1BhdGgpewogIGxldCBtZXRhZGF0YUNvZGUgPSBuYW5vaWQoKTsKCiAgbGV0IHByb2Nlc3MgPSBleGVjKGAke2ZmbXBlZ1BhdGh9IC1pICR7dmlkZW9QYXRofSAtdmYgc2VsZWN0PSdndGUoc2NlbmVcLDApJyxtZXRhZGF0YT1wcmludDpmaWxlPXNjZW5lc2NvcmVzXyR7bWV0YWRhdGFDb2RlfS50eHQgLWFuIC1mIG51bGwgLWAsIHsKICAgIGN3ZDogJ0M6XFxVc2Vyc1xcYXJkdWlcXHByb2dldHRpXFx2aWRlby1tb3Rpb24tZGV0ZWN0b3JcXHRtcCcKICB9KTsKCiAgcHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YSkgPT4gewogICAgcG9zdE1lc3NhZ2UoewogICAgICB0eXBlOiAnc3Rkb3V0JywKICAgICAgZGF0YTogZGF0YQogICAgfSk7CiAgICBjb25zb2xlLmxvZyhgc3Rkb3V0OiAke2RhdGF9YCk7CiAgfSk7CiAgCiAgcHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCAoZGF0YSkgPT4gewogICAgbGV0IGZyYW1lID0gIiI7CiAgICBsZXQgc3BlZWQgPSAiIjsKICAgIHRyeSB7CiAgICAgIGZyYW1lID0gZGF0YS5zcGxpdCgiZnJhbWU9IilbMV0uc3BsaXQoIiBmcHM9IilbMF0udHJpbSgpOwogICAgICBzcGVlZCA9IGRhdGEuc3BsaXQoInNwZWVkPSIpWzFdLnRyaW0oKS5zcGxpdCgiICIpWzBdOwogICAgfSBjYXRjaChlKSB7fQogICAgcG9zdE1lc3NhZ2UoewogICAgICB0eXBlOiAnc3RkZXJyJywKICAgICAgZGF0YTogZGF0YSwKICAgICAgZnJhbWU6IGZyYW1lLAogICAgICBzcGVlZDogc3BlZWQKICAgIH0pOwogICAgY29uc29sZS5sb2coYGZyYW1lOiAke2ZyYW1lfSAtIHNwZWVkOiAke3NwZWVkfSAtIHN0ZG91dDogJHtkYXRhfWApOwogIH0pOwogIAogIHByb2Nlc3Mub24oJ2Nsb3NlJywgKGNvZGUpID0+IHsKICAgIHBvc3RNZXNzYWdlKHsKICAgICAgdHlwZTogJ2ZmbXBlZ19jbG9zZScsCiAgICAgIGNvZGU6IGNvZGUsCiAgICAgIG1ldGFkYXRhQ29kZTogbWV0YWRhdGFDb2RlCiAgICB9KTsKICAgIGNvbnNvbGUubG9nKGBjaGlsZCBwcm9jZXNzIGV4aXRlZCB3aXRoIGNvZGUgJHtjb2RlfWApOwogIH0pOwp9CgpmdW5jdGlvbiBwYXJzZU1ldGFkYXRhKG1ldGFkYXRhQ29kZSl7CiAgaWYobWV0YWRhdGFDb2RlICE9PSB1bmRlZmluZWQpIHsKICAgIGxldCBtZXRhZGF0YSA9IFtdOwoKICAgIGxldCBwcmV2aW91c0xpbmUgPSAiIjsKICAgIGNvbnN0IGZpbGVTdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHBhdGguam9pbignQzpcXFVzZXJzXFxhcmR1aVxccHJvZ2V0dGlcXHZpZGVvLW1vdGlvbi1kZXRlY3RvclxcdG1wJywgYHNjZW5lc2NvcmVzXyR7bWV0YWRhdGFDb2RlfS50eHRgKSk7CgogICAgY29uc29sZS5sb2coYHBhcnNpbmcgbWV0YWRhdGEgZm9yICR7bWV0YWRhdGFDb2RlfWApOwogIAogICAgY29uc3QgcmwgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2UoewogICAgICBpbnB1dDogZmlsZVN0cmVhbSwKICAgICAgY3JsZkRlbGF5OiBJbmZpbml0eQogICAgfSk7CgogICAgY29uc29sZS5sb2coIk9LIiwgcmwpOwogICAgcmwub24oImxpbmUiLCAobGluZSkgPT4gewogICAgICAvL1JlYWQgdHdvIGxpbmVzIGF0IHRpbWUKICAgICAgaWYgKCFwcmV2aW91c0xpbmUpIHsKICAgICAgICAvLyBubyBwcmV2aW91cyBsaW5lIHRvIGNvbXBhcmUgdG8sIHNvIGp1c3QgcmVtZW1iZXIgdGhpcyBsaW5lCiAgICAgICAgcHJldmlvdXNMaW5lID0gbGluZTsKICAgICAgfSBlbHNlIHsKICAgICAgICBsaW5lID0gcHJldmlvdXNMaW5lICsgIiAiICsgbGluZTsKICAgICAgICBjb25zb2xlLmxvZyhsaW5lKTsKICAgICAgICBtZXRhZGF0YS5wdXNoKHsKICAgICAgICAgIGZyYW1lOiBsaW5lLnNwbGl0KCJmcmFtZToiKVsxXS5zcGxpdCgiICIpWzBdLnRyaW0oKSwKICAgICAgICAgIHB0czogbGluZS5zcGxpdCgicHRzOiIpWzFdLnNwbGl0KCIgIilbMF0udHJpbSgpLAogICAgICAgICAgcHRzX3RpbWU6IGxpbmUuc3BsaXQoInB0c190aW1lOiIpWzFdLnNwbGl0KCIgIilbMF0udHJpbSgpLAogICAgICAgICAgc2NlbmVfc2NvcmU6IGxpbmUuc3BsaXQoInNjZW5lX3Njb3JlPSIpWzFdLnNwbGl0KCIgIilbMF0udHJpbSgpCiAgICAgICAgfSk7CiAgICAgICAgcHJldmlvdXNMaW5lID0gIiI7CiAgICAgIH0KICAgIH0pOwoKICAgIHJsLm9uKCJjbG9zZSIsICgpID0+IHsKICAgICAgcG9zdE1lc3NhZ2UoewogICAgICAgIHR5cGU6ICdtZXRhZGF0YScsCiAgICAgICAgbWV0YWRhdGE6IG1ldGFkYXRhCiAgICAgIH0pOwogICAgfSk7CiAgfQp9Cgp0cnl7CiAgYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsICh7IGRhdGEgfSkgPT4gewogICAgY29uc29sZS5sb2coZGF0YSkKICAgIHN3aXRjaCAoZGF0YS5jb21tYW5kKSB7CiAgICAgIGNhc2UgInN0YXJ0IjoKICAgICAgICBydW5Qcm9jZXNzaW5nKGRhdGEudmlkZW9QYXRoKTsKICAgICAgICBicmVhazsKICAgICAgCiAgICAgIGNhc2UgImZyYW1lc19jb3VudCI6CiAgICAgICAgZ2V0RnJhbWVzQ291bnQoZGF0YS52aWRlb1BhdGgpOwogICAgCiAgICAgIGNhc2UgInBhcnNlX21ldGFkYXRhIjoKICAgICAgICBwYXJzZU1ldGFkYXRhKGRhdGEubWV0YWRhdGFDb2RlKTsKICAgICAgICBicmVhazsKCiAgICAgIGRlZmF1bHQ6CiAgICAgICAgYnJlYWs7CiAgICB9CiAgfSk7Cn0gY2F0Y2goZSkgeyB9Cg==");
    let blob = new Blob([response], {type: 'application/javascript'});
    //const worker = new Worker('../../../assets/ffmpeg-process.worker.js');
    const worker = new Worker(URL.createObjectURL(blob));
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
      return sceneScore > 0.008;
    }

    let motion = [
      {motion: true, time: 0, count: 0},
      {motion: false, time: 0, count: 0}
    ];

    let framesWithMotion = 0;
    let framesWithNoMotion = 0;
    let previousTime = 0;
    metadata.forEach((obj) => {
      if(motionDetected(obj.scene_score)) {
        motion[0].time += obj.pts_time - previousTime;
        framesWithNoMotion = 0;
        framesWithMotion++;
        if(framesWithMotion > 4) {
          motion[0].count++;
        }
      } else {
        console.log("no motion", framesWithNoMotion);
        motion[1].time += obj.pts_time - previousTime;
        framesWithMotion = 0;
        framesWithNoMotion++;
        if(framesWithNoMotion > 4) {
          motion[1].count++;
        }
      }
      previousTime = obj.pts_time;
    });
    this.motionListLoaded = true;
    this.motionList = motion;
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
