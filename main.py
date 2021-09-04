import eel
from tkinter import Tk, filedialog
import bottle as btl
from bottle import template, static_file, response
from nanoid import generate as nanoid
import cv2, imutils
import subprocess
import os, sys
import tempfile

if getattr(sys, 'frozen', False):
    eel.init('UI')
else:
    eel.init('UI/dist/video-motion-detector')

loadedVideos = {}

tempDirObj = tempfile.TemporaryDirectory()
tempDir = tempDirObj.name

#TODO: add settings and change var names
min_area = 700

@eel.expose
def python_open_file_dialog():
    root = Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    open_file = filedialog.askopenfilenames(filetypes=[("Video Files", ".mp4 .mov .avi .mkv")])
    filepath = open_file[0]
    id = nanoid()
    loadedVideos[id] = filepath
    return {
        'filePath': filepath,
        'id': id
    }

@eel.expose
def python_get_video_frames(id):
    if not id in loadedVideos:
        return {
            'status': 'error',
            'error': 'Video not loaded',
            'framesCount': 0
        }
    filepath = loadedVideos[id]
    video = cv2.VideoCapture(filepath)
    return {
        'status': 'ok',
        'error': '',
        'framesCount': video.get(cv2.CAP_PROP_FRAME_COUNT),
        'framerate': video.get(cv2.CAP_PROP_FPS)
    }

@eel.expose
def python_process_video_ffmpeg(id):
    if not id in loadedVideos:
        return {
            'status': 'error',
            'error': 'Video not loaded'
        }
    filepath = loadedVideos[id]
    command = "ffmpeg -i {} -vf select='gte(scene\,0)',metadata=print:file=scenescores_{}.txt -an -f null -".format(filepath, id)
    print(command)
    process = subprocess.Popen(command, cwd=tempDir, shell=True, stderr=subprocess.PIPE)

    while True:
        output = process.stderr.read(100).decode("utf-8")
        if output == '' and process.poll() != None:
            break
        if "frame=" in output:
            frame = output.split("frame=")[1].split(" fps=")[0].strip()
            try:
                speed = output.split("speed=")[1].strip().split(" ")[0]
            except:
                speed = "unknown"
            eel._js_call('processProgressUpdate', [frame, speed])
    
    return {
        'status': 'success',
        'id': id,
        'command': command,
        'tmpPath': tempDir
    }

@eel.expose
def python_process_video_opencv2(id):
    if not id in loadedVideos:
        return {
            'status': 'error',
            'error': 'Video not loaded'
        }

    metadata = []
    filepath = loadedVideos[id]
    video = cv2.VideoCapture(filepath)

    firstFrame = None
    for i in range(0,100):
        frame = video.read()[1]
        frame = imutils.resize(frame, width=500)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        if frame is None:
            break
        else:
            firstFrame = gray
    #cv2.imshow("First frame", firstFrame)
    video.release()

    video = cv2.VideoCapture(filepath)

    while True:
        # grab the current frame and initialize the occupied/unoccupied
        # text
        frame = video.read()
        frame = frame[1]
        motionDetected = False
        text = "No motion detected"
        # if the frame could not be grabbed, then we have reached the end
        # of the video
        if frame is None:
            break

        frames_count = video.get(cv2.CAP_PROP_POS_FRAMES)
        pts_time = int(video.get(cv2.CAP_PROP_POS_MSEC)) / 1000 + 0.03
        eel._js_call('processProgressUpdate', [frames_count, "unknown"])
        print(frames_count,pts_time)

        # resize the frame, convert it to grayscale, and blur it
        frame = imutils.resize(frame, width=500)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        # compute the absolute difference between the current frame and
        # first frame
        frameDelta = cv2.absdiff(firstFrame, gray)
        thresh = cv2.threshold(frameDelta, 110, 255, cv2.THRESH_BINARY)[1]
        # dilate the thresholded image to fill in holes, then find contours
        # on thresholded image
        thresh = cv2.dilate(thresh, None, iterations=2)
        cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        # loop over the contours
        for c in cnts:
            # if the contour is too small, ignore it
            if cv2.contourArea(c) < min_area:
                continue
            # compute the bounding box for the contour, draw it on the frame,
            # and update the text
            (x, y, w, h) = cv2.boundingRect(c)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            motionDetected = True
            text = "Motion detected"

        if motionDetected:
            sceneScore = 1
        else:
            sceneScore = 0
        metadata.append({
            'frame': frames_count,
            'pts_time': pts_time,
            'scene_score': sceneScore,
            'motion_detected': motionDetected
        })

    	# draw the text on the frame
        #cv2.putText(frame, text, (10, 20),
        #    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        # show the frame and record if the user presses a key
        #cv2.imshow("Debug", frame)
        #cv2.imshow("Thresh", thresh)
        #cv2.imshow("Frame Delta", frameDelta)
        #key = cv2.waitKey(1) & 0xFF
        # if the `q` key is pressed, break from the lop
        #if key == ord("q"):
        #    break

    return {
        'status': 'success',
        'id': id,
        'metadata': metadata
    }

app = btl.default_app()

#https://stackoverflow.com/a/17262900
def enable_cors(fn):
    def _enable_cors(*args, **kwargs):
        # set CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'

        if btl.request.method != 'OPTIONS':
            # actual request; reply with the actual response
            return fn(*args, **kwargs)

    return _enable_cors

@app.route('/ping/')
@enable_cors
def ping():
    return 'pong'

@app.route('/video/<id>')
@enable_cors
def get_video(id):
    if id in loadedVideos:
        path = loadedVideos[id]
        #return template('Video id: <b>{{id}}</b><br>Path: <b>{{path}}</b>', id=id, path=path)
        filename = os.path.basename(path)
        directory = path.replace(filename, '')
        return static_file(filename, root=directory)
    else:
        return 'Error: <b>Video not found</b>'

@app.route('/ffmpeg_raw_metadata/<id>')
@enable_cors
def get_ffmpeg_raw_metadata(id):
    print(loadedVideos)
    if id in loadedVideos:
        return static_file('scenescores_{}.txt'.format(id), root=tempDir)
    else:
        return 'Error: <b>Metadata not found</b>'

@app.route('/ffmpeg_metadata/<id>')
@enable_cors
def get_ffmpeg_metadata(id):
    print(loadedVideos)
    metadata = []
    if id in loadedVideos:
        with open(os.path.join(tempDir, 'scenescores_{}.txt'.format(id))) as file:
            precedent_line = None
            for line in file:
                if not precedent_line:
                    precedent_line = line
                else:
                    line = precedent_line + line
                    metadata.append({
                        'frame': line.split("frame:")[1].split(" ")[0].strip(),
                        'pts_time': line.split("pts_time:")[1].split("\n")[0].strip(),
                        'scene_score': line.split("scene_score=")[1].split(" ")[0].strip()
                    })
                    precedent_line = None
        return dict(data=metadata)
    else:
        return 'Error: <b>Metadata not found</b>'

if getattr(sys, 'frozen', False):
    eel.start("index.html", app=app)
else:
    eel.start({ 'port': 4200 }, app=app)
