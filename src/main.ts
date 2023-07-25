import { WechatyBuilder } from "wechaty";
import QRCode from "qrcode";
import { ChatGPTBot } from "./bot.js";
import {config} from "./config.js";
import DBUtils from "./data.js";
const chatGPTBot = new ChatGPTBot();

const bot =  WechatyBuilder.build({
  name: "wechat-assistant", // generate xxxx.memory-card.json and save login data for the next login
  puppet: "wechaty-puppet-wechat",
  puppetOptions: {
    uos: true
  }
});
async function main() {
  const initializedAt = Date.now()
  bot
    .on("scan", async (qrcode, status) => {
      const url = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
      console.log(`Scan QR Code to login: ${status}\n${url}`);
      console.log(
        await QRCode.toString(qrcode, { type: "terminal", small: true })
      );
    })
    .on("login", async (user) => {
      // DBUtils.getUserByUsername(user.name());
      // DBUtils.setPrompt(user.name(),'你是一个互联网营销团队客服助手，你只能回答关于互联网营销相关的问题,当客户问你好或你是谁时，请回答我是海风小JJ')
      // const msgs = DBUtils.getUserByUsername(user.name()).chatMessage

      chatGPTBot.setBotName(user.name());
      console.log(`User ${user} logged in`);
      console.log(`私聊触发关键词: ${config.chatPrivateTriggerKeyword}`);
      console.log(`已设置 ${config.blockWords.length} 个聊天关键词屏蔽. ${config.blockWords}`);
      console.log(`已设置 ${config.chatgptBlockWords.length} 个ChatGPT回复关键词屏蔽. ${config.chatgptBlockWords}`);
    })
    .on("message", async (message) => {
      if (message.date().getTime() < initializedAt) {
        return;
      }
      if (message.text().startsWith("/ping")) {
        await message.say("pong");
        return;
      }
      try {
        await chatGPTBot.onMessage(message);
      } catch (e) {
        console.error(e);
      }
    });
  try {
    await bot.start();
  } catch (e) {
    console.error(
      `⚠️ Bot start failed, can you log in through wechat on the web?: ${e}`
    );
  }
}
main();
