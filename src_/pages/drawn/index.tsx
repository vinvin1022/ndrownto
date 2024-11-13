import "./index.scss";
import { useEffect, useRef, useState } from "react";
import { Button, Canvas, Slider, View } from "@tarojs/components";
import Taro from "@tarojs/taro";

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
  | { type: "erase"; x: number; y: number; size: number }; // 新增擦除操作

const Drawn = () => {
  const handleHuabi = () => {
    console.log("handleHuabi");
    toggleEraser();
  };
  const handleCachu = () => {
    console.log("handleCachu");
    toggleEraser();
  };
  const handleTietu = () => {
    console.log("handleTietu");
    Taro.chooseImage({
      success: function (res) {
        console.log(res);
        addImage(
          res.tempFilePaths[0],
          Math.random() * 320 + 20,
          Math.random() * 230 + 20,
          50,
          50
        );
        // ctx.current?.drawImage(res.tempFilePaths[0], 50, 50, 50, 50);
        // ctx.current?.draw(true);
      },
    });
  };
  const handleQingkong = () => {
    console.log("handleQingkong");
    ctx.current?.clearRect(0, 0, 1000, 300);
    ctx.current?.draw();
    operations.current.push({
      type: "qingkong",
    });
  };
  // const handleCehui = () => {
  //   console.log("handleCehui");
  //   // ctx.current?.save()
  //   // ctx.current?.setFillStyle('red')
  //   // ctx.current?.fillRect(10, 10, 150, 100)
  //   // restore to the previous saved state
  //   ctx.current?.restore();
  //   // ctx.current?.fillRect(50, 50, 150, 100)
  //   ctx.current?.draw();
  // };
  // const handleChongzuo = () => {
  //   console.log("handleChongzuo");
  // };
  const handleSuofang = () => {
    console.log("handleSuofang");
  };
  const [penSize, setPenSize] = useState(5); // 初始画笔尺寸
  const [smoothness, setSmoothness] = useState(1); // 初始平滑度
  const isDrawing = useRef(false);
  const ctx = useRef<Taro.CanvasContext | null>(null);
  const points = useRef<Point[]>([]); // 当前路径的点集
  const operations = useRef<Operation[]>([]); // 保存所有绘制操作
  const undoStack = useRef<Operation[]>([]); // 保存已撤回的操作
  const [isEraser, setIsEraser] = useState(false); // 控制是否为擦除模式
  const [eraserSize, setEraserSize] = useState(20); // 擦除器的粗细
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    // 创建 Canvas 上下文
    ctx.current = Taro.createCanvasContext("myCanvas");
  }, []);

  const handleTouchStart = (e) => {
    isDrawing.current = true;
    points.current = [{ x: e.touches[0].x, y: e.touches[0].y }];
  };

  const handleTouchMove = (e) => {
    if (!isDrawing.current) return;
    const touch = e.touches[0];
    points.current.push({ x: touch.x, y: touch.y });

    if (isEraser) {
      // 擦除模式
      // 获取擦除区域的图像数据，以便撤回时恢复
      // const imageData = ctx.current?.getImageData(
      //   touch.x - eraserSize / 2,
      //   touch.y - eraserSize / 2,
      //   eraserSize,
      //   eraserSize
      // );
      // ctx.current?.clearRect(
      //   touch.x - eraserSize / 2,
      //   touch.y - eraserSize / 2,
      //   eraserSize,
      //   eraserSize
      // ); // 擦除区域
      // operations.current.push({
      //   type: "erase",
      //   x: touch.x,
      //   y: touch.y,
      //   size: eraserSize,
      //   erasedData: imageData, // 保存擦除区域的图像数据
      // });
      // ctx.current?.draw(true);
    } else {
      ctx.current?.beginPath();
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
  };

  const handleTouchEnd = () => {
    if (points.current.length > 0 && !isEraser) {
      operations.current.push({
        type: "path",
        points: [...points.current],
        lineWidth: penSize,
      });
      points.current = [];
      undoStack.current = []; // 清空重做栈
    }
    isDrawing.current = false;
  };

  // 恢复擦除区域
  const restoreErase = (eraseData: ImageData) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(eraseData, eraseData.width / 2, eraseData.height / 2); // 恢复擦除区域
  };

  const redrawCanvas = () => {
    ctx.current?.clearRect(0, 0, 1000, 300);
    operations.current.forEach((op) => {
      switch (op.type) {
        case "path":
          ctx.current?.beginPath();
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
          // 擦除操作不需要重新绘制
          // restoreErase(op.erasedData);
          break;
        default:
          break;
      }
    });
    ctx.current?.draw();
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
    addText(
      ["a", "b", "c", "d", "e"][Math.round(Math.random() * 4)],
      Math.random() * 330 + 20,
      Math.random() * 280 + 20,
      Math.random() * 30 + 10
    );
  };

  // 开关擦除模式
  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  const addImage = (
    url: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    operations.current.push({ type: "image", url, x, y, width, height });
    undoStack.current = [];
    redrawCanvas();
  };

  const addText = (content: string, x: number, y: number, fontSize: number) => {
    operations.current.push({ type: "text", content, x, y, fontSize });
    undoStack.current = [];
    redrawCanvas();
  };
  return (
    <View>
      <Canvas
        // type="2d"
        id="myCanvas"
        style={{ width: "100%", height: "300px", backgroundColor: "#ccc" }}
        canvasId="myCanvas"
        onTouchStart={handleTouchStart} // 绑定触摸事件
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
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
      <View style={{ display: "flex" }}>
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
        <Button size="mini" onTap={handleTietu}>
          贴图
        </Button>
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
