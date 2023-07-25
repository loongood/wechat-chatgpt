import {
  Configuration,
  CreateImageRequestResponseFormatEnum,
  CreateImageRequestSizeEnum,
  OpenAIApi
} from "openai";
import fs from "fs";
import DBUtils from "./data.js";
import {config} from "./config.js";

const configuration = new Configuration({
  apiKey: config.openai_api_key,
  // basePath:"https://ai.goaii.cc/openai/v1"
  // basePath: "https://ai.goaii.cc/openai",
  basePath: config.api,
});
const openai = new OpenAIApi(configuration);

/**
 * Get completion from OpenAI
 * @param username
 * @param message
 */
async function chatgpt(username:string,message: string): Promise<string> {
  // 先将用户输入的消息添加到数据库中
  let sp = '```深圳海风交互是一家致力于抖音代运营，抖音推广，短视频直播带货等新媒体营销推广的短视频代运营公司，'
  +'我们配备专业短视频运营推广策划团队，根据用户提出的需求结合市场调查分析，精准定位进行运营策划推广。'
  + '深耕短视频垂直领域，打造专业的六 位（定位、编剧、拍摄、剪辑、投放、运营）一体 （粉丝流量变现）短视频引流变现流程体系。'
  + '深圳海风交互有着15年的互联网运营推广经验，服务客户包括机械设备、教育培训、家居建材、生活服务、招商加盟'
  + '餐饮服务、母婴宠物、食品行业、零售行业、服装配饰、休闲娱乐。'
  + '我们的服务价格是：抖音代运营3500元/月；短视频1000元/条。我们的产品目前是全网最低价。为什么今天的数据比较差？'
  + '1 可能是由于市场竞争激烈、节假日影响、活动策划或推广渠道效果等因素导致 2 和过去相比，近期的差异并非常态，而是一个临时的波动 ```'
  // let pp = "请基于上面的内容回答问题："+message+",如果该问题在上面的内容中没有结果，请输出：更多详情请联系客服，电话18620360207"
  let pp = sp+",请基于上面的内容回答问题："+message
  DBUtils.addUserMessage(username, pp);
  // DBUtils.addUserMessage(username, message);
  const messages = DBUtils.getChatMessage(username);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages,
    temperature: config.temperature,
  });
  let assistantMessage = "";
  try {
    if (response.status === 200) {
      assistantMessage = response.data.choices[0].message?.content.replace(/^\n+|\n+$/g, "") as string;
    }else{
      console.log(`Something went wrong,Code: ${response.status}, ${response.statusText}`)
    }
  }catch (e:any) {
    if (e.request){
      console.log("请求出错");
    }
  }
  return assistantMessage;
}

/**
 * Get image from Dall·E
 * @param username
 * @param prompt
 */
async function dalle(username:string,prompt: string) {
  const response = await openai.createImage({
    prompt: prompt,
    n:1,
    size: CreateImageRequestSizeEnum._256x256,
    response_format: CreateImageRequestResponseFormatEnum.Url,
    user: username
  }).then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.data[0].url;
  }else{
    return "Generate image failed"
  }
}

/**
 * Speech to text
 * @param username
 * @param videoPath
 */
async function whisper(username:string,videoPath: string): Promise<string> {
  const file:any= fs.createReadStream(videoPath);
  const response = await openai.createTranscription(file,"whisper-1")
    .then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.text;
  }else{
    return "Speech to text failed"
  }
}

export {chatgpt,dalle,whisper};