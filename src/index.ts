import {
  createAddon,
  runCli,
  DashboardItem,
  SeriesEpisodeItem,
} from "@mediaurl/sdk";
const puppeteer = require("puppeteer");
import * as cheerio from "cheerio";
const axios = require("axios");

interface SouthParkItem {
  title: string;
  thumbnail: string;
  link: string;
  isDic: boolean;
}
interface idSouthParkItem {
  title: string;
  link: string;
  description: string;
}

const parseId = async (html: string): Promise<idSouthParkItem> => {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content") as string;
  const lnk =  $('meta[property="og:url"]').attr('content') as string;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(lnk);
  await page.click('.edge-placeholder-button')
  await page.waitForSelector(".edge-placeholder-image");
  const video = await page.$$eval(".edge-placeholder-image", (el) =>
    el.map((x) => x.getAttribute("style"))
  );
  await browser.close();
  var spt = video;
  var spt1 = spt.toString().replace('background-image: url("https://playplex.mtvnimages.com/uri/mgid:arc:content:southpark.intl:', '');
  var spt2 = spt1.toString().replace('?stage=staging&ep=shared.southpark.global");', '');
  const description = $('meta[property="og:description"]').attr(
    "content"
  ) as string;

  const datajson = `https://media.mtvnservices.com/pmt/e1/access/index.html?uri=mgid:arc:episode:southpark.intl:${spt2.toString()}&configtype=edge&ref=${lnk.toString()}`;
  const { data } = await axios.get(datajson);
  var guidremove = data.feed.items[1].guid.toString().replace('mgid:arc:video:southpark.intl:', '');

  
  return {
    title: title,
    link: guidremove,
    description: description,
  };
};

const parseList = async (html: string): Promise<SouthParkItem[]> => {
  const results: SouthParkItem[] = [];
  const $ = cheerio.load(html);

    if ($("ul.items-wrap").length > 0) {
      $("ul.items-wrap > li").each((index, elem) => {
        let isDic = false;
        const link = $(elem).find("a").first().attr("href") as string;
        const saltimage = $(elem).find("img").last().attr("srcset") as string;
        var res = saltimage.replace("quality=0.7", "quality=0.02");

        const item: SouthParkItem = {
          title: $(elem).find("h2").text() as string,
          thumbnail: res,
          link: link,
          isDic: isDic,
        };
        results.push(item);
      });
  }
  return results;
};

const dashboardsList = async (): Promise<DashboardItem[]> => {
  let url = "https://www.southparkstudios.com/seasons/south-park";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const dash: DashboardItem[] = [];
  $("[aria-selected='false']").each((index, elem) => {
    const item: DashboardItem = {
      id: ($(elem).find("a").attr("href") as string) || "",
      name: $(elem).find("a").text()?.toLocaleLowerCase() as string,
      hideOnHomescreen: false,
    };
    dash.push(item);
  });
  return dash;
};

(async () => {
  const dashboardList = await dashboardsList();

  const southParksAddon = createAddon({
    id: "southpark",
    name: "SouthPark",
    description: "SouthPark Videos",
    icon: "https://www.southparkstudios.com/favicon.ico",
    version: "0.0.1",
    itemTypes: ["movie", "series"],
    catalogs: [
      {
          features: {
              search: { enabled: true }
          },
          options: {
              imageShape: "landscape",
              displayName: true
          },
                      

      }
  ],
    dashboards: dashboardList,
  });

  southParksAddon.registerActionHandler("catalog", async (input, ctx) => {
    await dashboardsList();
    const { fetch } = ctx;
    const { id } = input; // cagetory get name
    let search = false;
    let url = "https://www.southparkstudios.com";
    let siSlice = id.toString().substring(0, 1);

    if (input.search) {
      url =
        url +
        "/ajax/widget/render?widget=autocomplete_search&content_pool_id=28&keyword=" +
        input.search +
        " &load=1&language=tr"; // get search
      search = true;
    } else {
      url = url + id;
    }

    const results = await fetch(url).then(async (resp) => {
      return parseList(await resp.text());
    });

    return {
      nextCursor: null,
      items: results.map((item) => {
        const id = item.link;
        if (item.isDic) {
          return {
            id,
            ids: { id },
            type: "directory",
            name: item.title,
            images: {
              poster: item.thumbnail,
            },
          };
        } else {
          return {
            id,
            ids: { id },
            type: "movie",
            name: `${item.title}`,
            images: {
              poster: item.thumbnail,
            },
          };
        }
      }),
    };
  });

  southParksAddon.registerActionHandler("item", async (input, ctx) => {
    const { fetch } = ctx;
    const url = "https://www.southparkstudios.com" + input.ids.id;

    const result = await fetch(url).then(async (resp) =>
      parseId(await resp.text())
    );

    const dataitem = `https://media-utils.mtvnservices.com/services/MediaGenerator/mgid:arc:video:southpark.intl:${result.link.toString()}?arcStage=staging&accountOverride=intl.mtvi.com&billingSection=intl&ep=90877963&format=json&acceptMethods=hls&tveprovider=null`;
    const { data } = await axios.get(dataitem);
    var send = data.package.video.item[0].rendition[0].src

  
    return {
      type: "movie",
      ids: input.ids,
      title: result.title,
      name: result.title,
      description: result.description,
      sources: [
        {
          type: "url",
          url: send,
          name: result.title,
        },
      ],
    };  
  });

  runCli([southParksAddon], { singleMode: false });
})();
