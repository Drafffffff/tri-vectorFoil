import {
  createSignal,
  type Component,
  createEffect,
  onMount,
  Show,
} from "solid-js";

import styles from "./App.module.css";
import p5 from "p5";

const App: Component = () => {
  const [imgWidth, setImgWidth] = createSignal<number>(0);
  const [imgHeight, setImgHeight] = createSignal<number>(0);
  const [isUploadShow, setIsUploadShow] = createSignal<boolean>(true);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [fileBase64, setFileBase64] = createSignal<string | null>(null);
  const [transformedFile, setTransformedFile] = createSignal<string | null>(
    null
  );
  const [statusText, setStatusText] = createSignal<string>("");
  const s = (p: p5) => {
    let x = 100;
    let y = 100;
    let myshader: p5.Shader;
    let img0: p5.Image;
    let img1: p5.Image;

    p.preload = () => {
      myshader = p.loadShader("shader.vert", "shader.frag");
      img0 = p.loadImage(transformedFile()!);
      img1 = p.loadImage(fileBase64()!);
    };
    p.setup = () => {
      const s = imgHeight() / imgWidth();
      const w = window.innerWidth;
      p.createCanvas(w, s * w, p.WEBGL);
      p.shader(myshader);
      myshader.setUniform("tex0", img0);
      myshader.setUniform("tex1", img1);
    };
    p.draw = () => {
      myshader.setUniform("u_time", p.frameCount * 0.02);
      myshader.setUniform("tex0", img0);
      myshader.setUniform("tex1", img1);
      p.background(0);
      p.fill(255);
      p.rect(x, y, 50, 50);
    };
  };
  const handleFileInput = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    setSelectedFile(file ?? null);
    setIsUploadShow(false);
  };
  //send file to server
  createEffect(() => {
    if (selectedFile()) {
      //transform image to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile()!);
      reader.onloadend = () => {
        const base64data = reader.result;
        setFileBase64(base64data as string);
        //send base64data to server
        setStatusText("正在计算空间坐标...");
        fetch("https://drafff-dpt-depth-estimation.hf.space/api/predict/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: [base64data] }),
        })
          .then((response) => response.json())
          .then((data) => {
            const img = data.data[0];
            setTransformedFile(img);
            const tmp = new Image();
            tmp.src = img;
            tmp.onload = () => {
              console.log(tmp.width);
              console.log(tmp.height);
              setImgWidth(tmp.width);
              setImgHeight(tmp.height);
            };

            console.log("Success:", img);
            setStatusText("");
            new p5(s, document.getElementById("sketch")!);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      };
    }
  });
  //transform base64 to image and show image
  createEffect(() => {
    if (transformedFile()) {
      const img = new Image();
      img.src = transformedFile()!;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        // document.body.appendChild(canvas);
      };
    }
  });
  return (
    <div class={styles.App}>
      <Show when={isUploadShow()}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileInput(e)}
        />
      </Show>
      {/* {selectedFile() && ( */}
      {/*   <img */}
      {/*     src={URL.createObjectURL(selectedFile()!)} */}
      {/*     alt="preview" */}
      {/*     width="200" */}
      {/*   /> */}
      {/* )} */}
      {/* {transformedFile() && ( */}
      {/*   <img src={transformedFile()!} alt="preview" width="200" height="200" /> */}
      {/* )} */}
      <p>{statusText()}</p>
      <div id="sketch"></div>
    </div>
  );
};

export default App;
