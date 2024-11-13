import { Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import React from "react";
import { BoundingClientRect } from "src/utils";

export type BoxBoun = {
  url: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

type TietuProps = {
  canvasBoxData: BoundingClientRect | undefined;
  onTietu: (data: BoxBoun) => void;
};

const Tietu: React.FC<TietuProps> = ({ canvasBoxData, onTietu }) => {
  console.log(canvasBoxData);
  const handleTietu = () => {
    Taro.chooseImage({
      count: 1, // 默认9
      sizeType: ["original", "compressed"],
      success: function (cosres) {
        const src = cosres.tempFilePaths[0];
        Taro.getImageInfo({
          src,
          success: function (res) {
            const nw = 100;
            const bl = res.width / nw;
            const nh = res.height / bl;
            console.log("bl: ", bl);

            const { top, left, height, width } =
              canvasBoxData as BoundingClientRect;
            const topwm = (top * 2 + height) / 2 - nh / 2;
            const leftwm = (left * 2 + width) / 2 - nw / 2;

            const tu = {
              url: src,
              top: topwm,
              left: leftwm,
              width: nw,
              height: nh,
            };
            console.log("tu: ", tu);
            onTietu(tu);
          },
        });
      },
    });
  };

  return (
    <Button size="mini" onTap={handleTietu}>
      贴图
    </Button>
  );
};

export default Tietu;
