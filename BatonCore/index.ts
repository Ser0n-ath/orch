import "dotenv/config";
import { Page, Stagehand } from "@browserbasehq/stagehand";

import dotenv from 'dotenv';
dotenv.config();



class BatonStagehand {
  private stagehand: Stagehand;
  constructor(){
    this.stagehand = new Stagehand(
    {
      env: "LOCAL",
      modelName: "openai/gpt-5",
      modelClientOptions: { apiKey: process.env.OPENAI_API_KEY },
      localBrowserLaunchOptions: {
        headless: true,           // run headless
        devtools: false,          // show devtools if you want
        viewport: { width: 1280, height: 720 },
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
        },
    });
  }


  

}

class Baton {

  constructor(){   

  }


}

function generateFnMap(page: Page) {
  return {
    extract: (query: string) => page.extract(query),
    act: (action: string) => page.act(action),
    observe: (observation: string) => page.observe(observation),
  };
}


class PageActionStack {
  stack: 

}

class PageActionContext {
  private fnMap; 
  constructor(private page: Page, private instructions: string) {
    this.fnMap = this.generateFnMap();
  }




  generateFnMap() {
    return {
      extract: (query: string) => this.page.extract(query),
      act: (action: string) => this.page.act(action),
      observe: (observation: string) => this.page.observe(observation),
    };
  }

}


interface PageFunction {
  name: string,
  action: string
}



async function main() {
  const stagehand = new Stagehand(
    {
    env: "LOCAL",
    modelName: "openai/gpt-5",
    modelClientOptions: { apiKey: process.env.OPENAI_API_KEY },
    localBrowserLaunchOptions: {
      headless: true,           // run headless
      devtools: false,          // show devtools if you want
      viewport: { width: 1280, height: 720 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
      },
    }
  );
  
  await stagehand.init();

  const page = stagehand.page;

  await page.goto("https://www.utoronto.ca/");

  const extractResult = await page.extract("Extract the title and date from the latest news page.");
  console.log(`Extract result:\n`, extractResult);



  // 
  // const actResult = await page.act("Click the 'Evals' button.");
  // console.log(`Act result:\n`, actResult);

  // const observeResult = await page.observe("What can I click on this page?");
  // console.log(`Observe result:\n`, observeResult);

  // const agent = await stagehand.agent({
  //   instructions: "You're a helpful assistant that can control a web browser.",
  // });

  // const agentResult = await agent.execute("What is the most accurate model to use in Stagehand?");
  // console.log(`Agent result:\n`, agentResult);

  await stagehand.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
