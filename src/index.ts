import {
  createAddon,
  runCli,
  DashboardItem,
  SubtitleRequest,
  Subtitle,
} from "@mediaurl/sdk";
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

type ResultSubtitle = {
  [k: string]: Subtitle[];
};

let Sub: any;

const parseId = async (html: string): Promise<idSouthParkItem> => {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content") as string;
  const lnk = $('meta[property="og:url"]').attr("content") as string;
  const ham = $("body").find('script[type="application/ld+json"]').toString();
  const spt = ham.split('"@id"')[1].split(",")[0].split(':"')[1].split('"')[0];

  const description = $('meta[property="og:description"]').attr(
    "content"
  ) as string;

  const datajson = `https://media.mtvnservices.com/pmt/e1/access/index.html?uri=mgid:arc:episode:southpark.intl:${spt}&configtype=edge&ref=${lnk.toString()}`;
  const { data } = await axios.get(datajson);
  const guidremove =
    data.feed.items.length > 1
      ? data.feed.items[1].guid
          .toString()
          .replace("mgid:arc:video:southpark.intl:", "")
      : data.feed.items[0].guid
          .toString()
          .replace("mgid:arc:episode:southpark.intl:", "");

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
        title: $(elem).find(".header").find("h2").text() as string,
        thumbnail: res,
        link: link,
        isDic: isDic,
      };
      results.push(item);
    });
  }
  return results;
};

const searchList = async (url): Promise<SouthParkItem[]> => {
  const results: SouthParkItem[] = [];
  const { data } = await axios.get(url);
  const items = data.response.items;

  items.map((item) => {
    let isDic = false;
    const link = item.id as string;
    const saltimage = item.media.image.url as string;
    var res = saltimage.replace("//", "https://");

    const result: SouthParkItem = {
      title: item.meta.header.title as string,
      thumbnail: res,
      link: link,
      isDic: isDic,
    };
    results.push(result);
  });
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
          search: { enabled: true },
        },
        options: {
          imageShape: "landscape",
          displayName: true,
        },
      },
    ],
    dashboards: dashboardList,
  });

  southParksAddon.registerActionHandler("catalog", async (input, ctx) => {
    await dashboardsList();
    const { fetch } = ctx;
    const { id } = input;
    let url = "";

    if (input.search.length > 3) {
      url =
        "https://www.southpark.de/api/search?q=" +
        input.search +
        "&activeTab=All&searchFilter=site&pageNumber=0&rowsPerPage=16"; // get search
    } else if (id && id[0] == "/") {
      url = "https://www.southparkstudios.com" + id;
    }

    const results = await fetch(url).then(async (resp) => {
      if (input.search.length > 3) {
        return searchList(url);
      } else {
        return parseList(await resp.text());
      }
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

    var url = "";
    if (input.ids.id && input.ids.id[0] == "/") {
      url = "https://www.southparkstudios.com" + input.ids.id;
    } else {
      url = input.ids.id as string;
    }

    const result = await fetch(url).then(async (resp) =>
      parseId(await resp.text())
    );

    const dataitem = `https://media-utils.mtvnservices.com/services/MediaGenerator/mgid:arc:video:southpark.intl:${result.link.toString()}?arcStage=staging&accountOverride=intl.mtvi.com&billingSection=intl&ep=50c78199&format=json&acceptMethods=hls&tveprovider=null`;
    const { data } = await axios.get(dataitem);
    var send = data.package.video.item[0].rendition[0].src;
    var sub = data.package.video.item[0].transcript;
    Sub = sub;
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

  southParksAddon.registerActionHandler(
    "subtitle",
    async (input: SubtitleRequest, ctx) => {
      const id = input.ids.id;
      const subData = Sub[0];
      const result = [
        {
          name: subData.label,
          language: subData.srclang,
          id: subData.typographic[1].format,
          type: subData.typographic[1].format,
          url: subData.typographic[1].src,
        },
      ];
      const subtitles = result;
      return subtitles ?? [];
    }
  );

  runCli([southParksAddon], { singleMode: false });
})();
