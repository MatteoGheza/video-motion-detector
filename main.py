import eel
from tkinter import Tk, filedialog
import bottle as btl
from bottle import template, static_file
from nanoid import generate as nanoid
import cv2
import subprocess
import os
import tempfile

eel.init('UI/dist/video-motion-detector')
#eel.init("webest")

loadedVideos = {}

tempDirObj = tempfile.TemporaryDirectory()
tempDir = tempDirObj.name

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
            speed = output.split("speed=")[1].strip().split(" ")[0]
            eel._js_call('processProgressUpdate', [frame, speed])
    
    return {
        'status': 'success',
        'id': id,
        'command': command,
        'tmpPath': tempDir
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
        'framesCount': video.get(cv2.CAP_PROP_FRAME_COUNT)
    }


app = btl.default_app()

@app.route('/video/<id>')
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
def get_ffmpeg_raw_metadata(id):
    print(loadedVideos)
    if id in loadedVideos:
        return static_file('scenescores_{}.txt'.format(id), root=tempDir)
    else:
        return 'Error: <b>Metadata not found</b>'

#eel.start("index.html")
eel.start({ 'port': 4200 }, app=app)
