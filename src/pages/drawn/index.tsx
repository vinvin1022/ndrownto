import "./index.scss";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Canvas,
  Slider,
  View,
  Image as TImage,
} from "@tarojs/components";
import Taro from "@tarojs/taro";
import { BoundingClientRect, getNodeRect } from "../../utils";
import Tietu from "../../components/Tietu";

interface Point {
  x: number;
  y: number;
}

type Operation =
  | { type: "path"; points: Point[]; lineWidth: number }
  | {
      type: "image";
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | { type: "text"; content: string; x: number; y: number; fontSize: number }
  | { type: "qingkong" }
  | { type: "erase"; points: Point[]; size: number }; // 新增擦除操作

const Drawn = () => {
  const [penSize, setPenSize] = useState(5); // 初始画笔尺寸
  const [smoothness, setSmoothness] = useState(1); // 初始平滑度
  const isDrawing = useRef(false);
  const ctx = useRef<Taro.CanvasContext | null>(null);
  const points = useRef<Point[]>([]); // 当前路径的点集
  const operations = useRef<Operation[]>([]); // 保存所有绘制操作
  const undoStack = useRef<Operation[]>([]); // 保存已撤回的操作
  const [isEraser, setIsEraser] = useState(false); // 控制是否为擦除模式
  const [eraserSize, setEraserSize] = useState(10); // 擦除器的粗细
  const [imgd, setImgd] = useState({
    url: "",
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [imgShow, setImgShow] = useState(false);

  const [canvasBoxRef, setCanvasBoxRef] = useState<BoundingClientRect>();

  const handleHuabi = () => {
    console.log("handleHuabi");
    toggleEraser(false);
  };
  const handleCachu = () => {
    console.log("handleCachu");
    toggleEraser(true);
  };
  const handleTietu = (data) => {
    setImgd(data);
    setImgShow(true);
  };
  const handleQingkong = () => {
    console.log("handleQingkong");
    ctx.current?.clearRect(0, 0, 360, 300);
    ctx.current?.draw();
    operations.current.push({
      type: "qingkong",
    });
  };

  const handleSuofang = () => {
    console.log("handleSuofang");
  };
  // 擦除器的粗细

  useEffect(() => {
    // 创建 Canvas 上下文
    ctx.current = Taro.createCanvasContext("myCanvas");
    // ctx.current?.setStrokeStyle("black");
    // ctx.current?.setLineCap("round");
    // ctx.current?.setLineJoin("round");
  }, []);



  const handleTouchStart = (e) => {
    isDrawing.current = true;
    points.current = [{ x: e.touches[0].x, y: e.touches[0].y }];
    ctx.current?.setLineCap("round");
    ctx.current?.setLineJoin("round");

    ctx.current?.setStrokeStyle("black");
    // ctx.current?.setLineCap("round");
    // ctx.current?.setLineJoin("round");
  };
  let lastTime = 0; // 用于限制绘制的频率
  const handleTouchMove = (e) => {
    if (!isDrawing.current) return;
    const touch = e.touches[0];

    points.current.push({ x: touch.x, y: touch.y });
    if (isEraser) {
      // 擦除模式
      ctx.current?.beginPath();
      ctx.current?.setStrokeStyle("#cccccc"); // 设置擦除颜色为白色
      ctx.current?.setLineWidth(eraserSize);

      points.current.forEach((point, index) => {
        if (index === 0) {
          ctx.current?.moveTo(point.x, point.y);
        } else {
          ctx.current?.lineTo(point.x, point.y);
        }
      });
      ctx.current?.stroke();
      ctx.current?.draw(true);
    } else {
      ctx.current?.beginPath();
      ctx.current?.setStrokeStyle("black");
      ctx.current?.setLineWidth(penSize);
      points.current.forEach((point, index) => {
        if (index === 0) {
          ctx.current?.moveTo(point.x, point.y);
        } else {
          ctx.current?.lineTo(point.x, point.y);
        }
      });
      ctx.current?.stroke();
      ctx.current?.draw(true);
    }
    // 获取当前时间戳
    const currentTime = Date.now();
    // 控制绘制的频率，防止过度绘制
    if (currentTime - lastTime < 18) return; // 每 16ms 更新一次，约60FPS
    console.log(`isEraser: ${isEraser}`);
    lastTime = currentTime;
  };

  const handleTouchEnd = () => {
    if (points.current.length > 0) {
      if (isEraser) {
        // 记录擦除操作
        operations.current.push({
          type: "erase",
          points: [...points.current],
          size: eraserSize,
        });
      } else {
        operations.current.push({
          type: "path",
          points: [...points.current],
          lineWidth: penSize,
        });
      }
      // undoStack.current = []; // 清空重做栈
      points.current = [];

      isDrawing.current = false;
    }
  };

  const redrawCanvas = () => {
    ctx.current?.clearRect(0, 0, 360, 300);
    console.log("operations:", operations);
    ctx.current?.setLineCap("round");
    ctx.current?.setLineJoin("round");
    operations.current.forEach((op) => {
      switch (op.type) {
        case "path":
          ctx.current?.beginPath();
          ctx.current?.setStrokeStyle("black");
          ctx.current?.setLineWidth(op.lineWidth);
          op.points.forEach((point, index) => {
            if (index === 0) {
              ctx.current?.moveTo(point.x, point.y);
            } else {
              ctx.current?.lineTo(point.x, point.y);
            }
          });
          ctx.current?.stroke();
          break;
        case "image":
          ctx.current?.drawImage(op.url, op.x, op.y, op.width, op.height);
          break;
        case "text":
          ctx.current?.setFontSize(op.fontSize);
          ctx.current?.fillText(op.content, op.x, op.y);
          break;
        case "qingkong":
          break;
        case "erase":
          ctx.current?.beginPath();

          ctx.current?.setStrokeStyle("#cccccc");
          ctx.current?.setLineWidth(op.size);
          op.points.forEach((point, index) => {
            if (index === 0) {
              ctx.current?.moveTo(point.x, point.y);
            } else {
              ctx.current?.lineTo(point.x, point.y);
            }
          });
          ctx.current?.stroke();
          break;
        default:
          break;
      }
    });

    requestAnimationFrame(() => ctx.current?.draw());
  };

  const handleCehui = () => {
    if (operations.current.length > 0) {
      const lastOperation = operations.current.pop();
      if (lastOperation) {
        undoStack.current.push(lastOperation);
        redrawCanvas();
      }
    }
  };

  const handleChongzuo = () => {
    if (undoStack.current.length > 0) {
      const redoOperation = undoStack.current.pop();
      if (redoOperation) {
        operations.current.push(redoOperation);
        redrawCanvas();
      }
    }
  };

  const handleXiezi = () => {
    const content = ["a", "b", "c", "d", "e"][Math.round(Math.random() * 4)];
    const fontSize = Math.random() * 30 + 10;
    const x = Math.random() * 330 + 20;
    const y = Math.random() * 180 + 20;
    ctx.current?.setFontSize(fontSize);
    ctx.current?.fillText(content, x, y);
    ctx.current?.draw(true);
    operations.current.push({ type: "text", content, x, y, fontSize });
    // undoStack.current = [];
  };

  // 开关擦除模式
  const toggleEraser = (isEraser) => {
    setIsEraser(isEraser);
  };

  const addImage = (
    url: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    operations.current.push({ type: "image", url, x, y, width, height });
    // undoStack.current = [];
    ctx.current?.drawImage(url, x, y, width, height);
    ctx.current?.draw(true);
  };

  const handleDelImg = async () => {
    setImgShow(false);
  };
  const handleTap = async () => {
    setImgShow(false);
    const rect = await getNodeRect("#himg");
    const { left, top } = canvasBoxRef as BoundingClientRect;
    console.log("imgrect: ", rect)
    console.log("canvasBoxRef: ", canvasBoxRef)

    addImage(
      imgd.url,
      rect.left - left,
      rect.top - top,
      rect?.width,
      rect?.height
    );
  }

  useEffect(() => {
    const getCanvasPosition = async () => {
      const rect = await getNodeRect("#myCanvas");
      // canvasBoxRef.current = rect;
      setCanvasBoxRef(rect)
    };

    getCanvasPosition();
  }, []);

  return (
    <View>
      <View style={{ padding: "10px 20px" }}>
        <Canvas
          // type="2d"
          id="myCanvas"
          style={{ width: "100%", height: "200px", backgroundColor: "#cccccc" }}
          canvasId="myCanvas"
          onTouchStart={handleTouchStart} // 绑定触摸事件
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTap={handleTap}
        />

        <View
          id="warpperimg"
          style={{
            display: imgShow ? "inline-block" : "none",
            position: "absolute",
            top: imgd.top,
            left: imgd.left,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              right: "-15px",
              width: "10px",
              height: "10px",
            }}
            onTap={handleDelImg}
          >
            X
          </View>
          <View
            style={{
              // width: "100px",
              // height: imgd.height,
              // padding: "3px",
              // border: "1px dashed #ddd",
            }}
          >
            <TImage
              id="himg"
              style={{ width: imgd.width, height: imgd.height}}
              mode="widthFix"
              src={imgd.url as string}
            />
          </View>
        </View>
      </View>
      <View>
        <View>画笔大小: {penSize}</View>
        <Slider
          min={1}
          max={20}
          step={1}
          value={penSize}
          onChange={(e) => setPenSize(e.detail.value)}
        />
      </View>
      <View>
        <View>平滑度: {smoothness}</View>
        <Slider
          min={1}
          max={500}
          step={1}
          value={smoothness}
          onChange={(e) => setSmoothness(e.detail.value)}
        />
      </View>
      <View style={{ display: "flex", flexWrap: "wrap" }}>
        <Button size="mini" onTap={handleHuabi}>
          画笔
        </Button>
        <Button size="mini" onTap={handleCachu}>
          擦除
        </Button>
        <Button onClick={() => setEraserSize(eraserSize + 5)}>
          增大擦除尺寸
        </Button>
        <Button onClick={() => setEraserSize(eraserSize - 5)}>
          减小擦除尺寸
        </Button>
        {/* <Button size="mini" onTap={handleTietu}>
          贴图
        </Button> */}
        <Tietu canvasBoxData={canvasBoxRef} onTietu={handleTietu}></Tietu>
        <Button size="mini" onTap={handleXiezi}>
          写字
        </Button>
        <Button size="mini" onTap={handleQingkong}>
          清空
        </Button>
        <Button size="mini" onTap={handleCehui}>
          撤回
        </Button>
        <Button size="mini" onTap={handleChongzuo}>
          重做
        </Button>
        <Button size="mini" onTap={handleSuofang}>
          缩放
        </Button>
      </View>
    </View>
  );
};

export default Drawn;
