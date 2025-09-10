import type { App } from "./app";

export async function render(app: App) {
  const totalFrames = app.engine.spectrum.length;
  const audioFile = app.engine.audioFile;
  const fps = 60;
  const prefix = "frame";
  const duration = totalFrames / fps; // in seconds
  const canvas = app.canvas.view;

  const frames: Uint8Array[] = [];

  function canvasToUint8Array(): Promise<Uint8Array> {
    return new Promise((res) => {
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Failed to render");
        const arr = new Uint8Array(await blob.arrayBuffer());
        res(arr);
      }, "image/png");
    });
  }

  function canvasToPPM(): Uint8Array {
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const rgb = new Uint8Array(width * height * 3);

    // Convert RGBA → RGB (drop alpha)
    for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
      rgb[j] = imageData.data[i]; // R
      rgb[j + 1] = imageData.data[i + 1]; // G
      rgb[j + 2] = imageData.data[i + 2]; // B
    }

    const header = `P6\n${width} ${height}\n255\n`;
    const headerBytes = new TextEncoder().encode(header);

    const ppm = new Uint8Array(headerBytes.length + rgb.length);
    ppm.set(headerBytes, 0);
    ppm.set(rgb, headerBytes.length);

    return ppm;
  }

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;

    app.engine.setTime(t);

    const bytes = canvasToPPM();
    frames.push(bytes);
  }

  console.log(frames[0]);

  for (let i = 0; i < frames.length; i++) {
    const name = `${prefix}${String(i).padStart(5, "0")}.ppm`;
    app.ffmpeg.writeFile(name, frames[i]);
  }

  const audioName = audioFile
    ? "audio_input" + (audioFile.name ? `_${audioFile.name}` : ".mp3")
    : "";
  const audioData = new Uint8Array(await audioFile!.arrayBuffer());

  app.ffmpeg.writeFile(audioName, audioData);

  const outName = "out.webm";
  const pattern = `${prefix}%05d.ppm`;

  console.log(await app.ffmpeg.listDir("/"));

  const args: string[] = [
    "-framerate",
    String(fps),
    "-i",
    "frame%05d.ppm",
    "-c:v",
    "libvpx",
    "-pix_fmt",
    "yuv420p",
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

  await app.ffmpeg.exec(args);

  const data = await app.ffmpeg.readFile(outName);
  const blob = new Blob([data], { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = outName;
  a.click();
}

export async function legacyRender(app: App) {
  const stream = app.canvas.view.captureStream(60); // fps
  const audioElement = app.engine.player;

  const context = new AudioContext();
  const dest = context.createMediaStreamDestination();
  const audioStream = context.createMediaStreamSource(
    //@ts-ignore
    audioElement.captureStream()
  );
  audioStream.connect(dest);

  stream.addTrack(dest.stream.getAudioTracks()[0]);

  const recorder = new MediaRecorder(stream, {
    mimeType: "video/mp4",
    videoBitsPerSecond: 2500000,
  });
  const chunks: Blob[] = [];

  recorder.onerror = (err) => {
    console.error(err);
  };

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    console.log("Recorder finished");

    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    // download or play

    const a = document.createElement("a");
    a.href = url;
    a.download = "out.webm";
    a.click();
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
