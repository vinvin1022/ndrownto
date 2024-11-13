import Taro from "@tarojs/taro";

type BoundingClientRect = Taro.NodesRef.BoundingClientRectCallbackResult;

function getNodeRect(selector: string): Promise<BoundingClientRect> {
  const query = Taro.createSelectorQuery();
  return new Promise((reslove, reject) => {
    query
      .select(selector)
      .boundingClientRect((rect: BoundingClientRect) => {
        if (rect) {
          console.log("node信息: ", rect);
          reslove(rect);
        } else {
          reject({ message: "没有获取到信息" });
        }
      })
      .exec();
  });
}

export { getNodeRect, BoundingClientRect };
