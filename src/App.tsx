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
  function resizeImageToMax(base64Image: string) {
    const img = new Image();
    img.src = base64Image;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    //delay until img is ready
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      setImgWidth(width);
      setImgHeight(height);
      console.log(width, height);

      if (width > height) {
        if (width > 1024) {
          height *= 1024 / width;
          width = 1024;
        }
      } else {
        if (height > 1024) {
          width *= 1024 / height;
          height = 1024;
        }
      }

      canvas.width = width;
      canvas.height = height;
      //delay until ctx is ready
      while (!ctx) {
        console.log("waiting for ctx");
      }

      ctx.drawImage(img, 0, 0, width, height);

      setFileBase64(canvas.toDataURL("image/jpeg"));
    };
  }
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

        resizeImageToMax(base64data as string);

        //send base64data to server
        setStatusText("正在计算空间坐标...");
      };
    }
  });

  createEffect(() => {
    if (fileBase64()) {
      //send base64data to server
      fetch("https://drafff-dpt-depth-estimation.hf.space/api/predict/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [fileBase64()] }),
      })
        .then((response) => response.json())
        .then((data) => {
          const img = data.data[0];
          setTransformedFile(img);
          console.log("Success:", img);
          setStatusText("");
          new p5(s, document.getElementById("sketch")!);
        })
        .catch((error) => {
          setStatusText("计算失败，请重试");
          console.error("Error:", error);
        });
    }
  });
  //createEffect(() => {
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
