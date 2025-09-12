import type { App } from "./app";

export async function render(app: App) {
  if (!app.engine.player.src || app.engine.player.src.length === 0) {
    app.statusBar.writeStatus("Could not render: no audio selected");
    return;
  }

  app.statusBar.writeStatus("Loading FFMPEG");

  await app.loadFFmpeg();

  app.statusBar.writeStatus("FFMPEG Loaded");

  const totalFrames = app.engine.spectrum.length;
  const audioFile = app.engine.audioFile;
  const fps = 60;
  const prefix = "frame";
  //const duration = totalFrames / fps; // in seconds
  const canvas = app.canvas.view;

  const frames: Uint8Array[] = [];

  function canvasToUint8Array(): Promise<Uint8Array> {
    return new Promise((res) => {
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Failed to render");

        res(new Uint8Array(await blob.arrayBuffer()));
      }, "image/png");
    });
  }

  app.statusBar.writeStatus("Rendering frames");

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;

    app.engine.setTime(t);

    const bytes = await canvasToUint8Array();
    frames.push(bytes);
  }

  for (let i = 0; i < frames.length; i++) {
    const name = `${prefix}${String(i).padStart(5, "0")}.png`;
    app.ffmpeg.writeFile(name, frames[i]);
  }

  const audioName = audioFile
    ? "audio_input" + (audioFile.name ? `_${audioFile.name}` : ".mp3")
    : "";
  const audioData = new Uint8Array(await audioFile!.arrayBuffer());

  app.ffmpeg.writeFile(audioName, audioData);

  const outName = "out.webm";
  //const pattern = `${prefix}%05d.ppm`;

  console.log(await app.ffmpeg.listDir("/"));

  const args: string[] = [
    "-framerate",
    String(fps),
    "-i",
    "frame%05d.png",
    "out.webm",
  ];

  /*const args: string[] = [
    "-y",
    "-framerate",
    String(fps),
    "-i",
    pattern,
    "-i",
    audioName,
    "-c:v",
    "libvpx",
    "-crf",
    "10",
    "-b:v",
    "1M",
    "-c:a",
    "libvorbis",
    "-shortest",
    outName,
  ];*/

  app.statusBar.writeStatus("Transcoding");

  await app.ffmpeg.exec(args);

  const data = await app.ffmpeg.readFile(outName);
  const blob = new Blob([data], { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = outName;
  a.click();
}

async function addAudio(app: App, blob: Blob) {
  if (!app.engine.player.src || app.engine.player.src.length === 0) {
    app.statusBar.writeStatus("Could not render: no audio selected");
    return;
  }

  app.statusBar.writeStatus("Loading FFMPEG");

  await app.loadFFmpeg();

  app.statusBar.writeStatus("FFMPEG Loaded");

  const videoFile = new Uint8Array(await blob.arrayBuffer());

  const audioFile = app.engine.audioFile;

  const audioName = audioFile
    ? "audio_input" + (audioFile.name ? `_${audioFile.name}` : ".mp3")
    : "";
  const audioData = new Uint8Array(await audioFile!.arrayBuffer());

  app.ffmpeg.writeFile(audioName, audioData);
  app.ffmpeg.writeFile("video.mp4", videoFile);

  const outName = "out.mp4";
  //const pattern = `${prefix}%05d.ppm`;

  console.log(await app.ffmpeg.listDir("/"));

  const args: string[] = [
    "-i",
    "video.mp4",
    "-i",
    audioName,
    "-c:v",
    "copy",
    "-shortest",
    "out.mp4",
  ];

  app.statusBar.writeStatus("Transcoding");

  await app.ffmpeg.exec(args);

  const data = await app.ffmpeg.readFile(outName);
  const finalBlob = new Blob([data], { type: "video/mp4" });
  const url = URL.createObjectURL(finalBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = outName;
  a.click();
}

export async function legacyRender(app: App) {
  if (!app.engine.player.src || app.engine.player.src.length === 0) {
    app.statusBar.writeStatus("Could not render: no audio selected");
    return;
  }

  const types = [
    "video/webm",
    "audio/webm",
    "video/webm;codecs=vp8",
    "video/webm;codecs=daala",
    "video/webm;codecs=h264",
    "audio/webm;codecs=opus",
    "video/mp4",
    "video/mp4;codecs=avc1.64003E,mp4a.40.2",
    "video/mp4;codecs=avc1.64003E,opus",
    "video/mp4;codecs=avc3.64003E,mp4a.40.2",
    "video/mp4;codecs=avc3.64003E,opus",
    "video/mp4;codecs=hvc1.1.6.L186.B0,mp4a.40.2",
    "video/mp4;codecs=hvc1.1.6.L186.B0,opus",
    "video/mp4;codecs=hev1.1.6.L186.B0,mp4a.40.2",
    "video/mp4;codecs=hev1.1.6.L186.B0,opus",
    "video/mp4;codecs=av01.0.19M.08,mp4a.40.2",
    "video/mp4;codecs=av01.0.19M.08,opus",
  ];

  for (const type of types) {
    console.log(
      `Is ${type} supported? ${
        MediaRecorder.isTypeSupported(type) ? "Yes!" : "Nope :("
      }`
    );
  }

  // disable all buttons

  const stream = app.canvas.view.captureStream(60); // fps

  const recorder = new MediaRecorder(stream, {
    mimeType: "video/mp4;codecs=av01.0.19M.08",
    videoBitsPerSecond: 15000000,
  });
  const chunks: Blob[] = [];

  recorder.onerror = (err) => {
    console.error(err);
  };

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    console.log("Recorder finished");

    const blob = new Blob(chunks, { type: "video/mp4" });
    addAudio(app, blob);
  };

  recorder.onstart = () => {
    console.log("Started Recording");
  };

  recorder.start();
  app.engine.setTime(0);
  app.engine.player.play();
  app.engine.player.addEventListener("ended", () => {
    console.log("audio finished");
    recorder.stop();
  }); // record 5s
}
