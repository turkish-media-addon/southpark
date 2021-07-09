"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var sdk_1 = require("@mediaurl/sdk");
var cheerio = __importStar(require("cheerio"));
var axios = require("axios");
var parseId = function (html) { return __awaiter(void 0, void 0, void 0, function () {
    var $, title, lnk, ham, spt, description, datajson, data, guidremove;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                $ = cheerio.load(html);
                title = $('meta[property="og:title"]').attr("content");
                lnk = $('meta[property="og:url"]').attr('content');
                ham = $("body").find('script[type="application/ld+json"]').toString();
                spt = ham.split('"@id"')[1].split(",")[0].split(':"')[1].split('"')[0];
                description = $('meta[property="og:description"]').attr("content");
                datajson = "https://media.mtvnservices.com/pmt/e1/access/index.html?uri=mgid:arc:episode:southpark.intl:" + spt + "&configtype=edge&ref=" + lnk.toString();
                return [4 /*yield*/, axios.get(datajson)];
            case 1:
                data = (_a.sent()).data;
                guidremove = data.feed.items[1].guid.toString().replace('mgid:arc:video:southpark.intl:', '');
                return [2 /*return*/, {
                        title: title,
                        link: guidremove,
                        description: description,
                    }];
        }
    });
}); };
var parseList = function (html) { return __awaiter(void 0, void 0, void 0, function () {
    var results, $;
    return __generator(this, function (_a) {
        results = [];
        $ = cheerio.load(html);
        if ($("ul.items-wrap").length > 0) {
            $("ul.items-wrap > li").each(function (index, elem) {
                var isDic = false;
                var link = $(elem).find("a").first().attr("href");
                var saltimage = $(elem).find("img").last().attr("srcset");
                var res = saltimage.replace("quality=0.7", "quality=0.02");
                var item = {
                    title: $(elem).find("h2").text(),
                    thumbnail: res,
                    link: link,
                    isDic: isDic,
                };
                results.push(item);
            });
        }
        return [2 /*return*/, results];
    });
}); };
var dashboardsList = function () { return __awaiter(void 0, void 0, void 0, function () {
    var url, data, $, dash;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "https://www.southparkstudios.com/seasons/south-park";
                return [4 /*yield*/, axios.get(url)];
            case 1:
                data = (_a.sent()).data;
                $ = cheerio.load(data);
                dash = [];
                $("[aria-selected='false']").each(function (index, elem) {
                    var _a;
                    var item = {
                        id: $(elem).find("a").attr("href") || "",
                        name: (_a = $(elem).find("a").text()) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase(),
                        hideOnHomescreen: false,
                    };
                    dash.push(item);
                });
                return [2 /*return*/, dash];
        }
    });
}); };
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var dashboardList, southParksAddon;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, dashboardsList()];
            case 1:
                dashboardList = _a.sent();
                southParksAddon = sdk_1.createAddon({
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
                southParksAddon.registerActionHandler("catalog", function (input, ctx) { return __awaiter(void 0, void 0, void 0, function () {
                    var fetch, id, search, url, siSlice, results;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, dashboardsList()];
                            case 1:
                                _a.sent();
                                fetch = ctx.fetch;
                                id = input.id;
                                search = false;
                                url = "https://www.southparkstudios.com";
                                siSlice = id.toString().substring(0, 1);
                                if (input.search) {
                                    url =
                                        url +
                                            "/ajax/widget/render?widget=autocomplete_search&content_pool_id=28&keyword=" +
                                            input.search +
                                            " &load=1&language=tr"; // get search
                                    search = true;
                                }
                                else {
                                    url = url + id;
                                }
                                return [4 /*yield*/, fetch(url).then(function (resp) { return __awaiter(void 0, void 0, void 0, function () {
                                        var _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    _a = parseList;
                                                    return [4 /*yield*/, resp.text()];
                                                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                                            }
                                        });
                                    }); })];
                            case 2:
                                results = _a.sent();
                                return [2 /*return*/, {
                                        nextCursor: null,
                                        items: results.map(function (item) {
                                            var id = item.link;
                                            if (item.isDic) {
                                                return {
                                                    id: id,
                                                    ids: { id: id },
                                                    type: "directory",
                                                    name: item.title,
                                                    images: {
                                                        poster: item.thumbnail,
                                                    },
                                                };
                                            }
                                            else {
                                                return {
                                                    id: id,
                                                    ids: { id: id },
                                                    type: "movie",
                                                    name: "" + item.title,
                                                    images: {
                                                        poster: item.thumbnail,
                                                    },
                                                };
                                            }
                                        }),
                                    }];
                        }
                    });
                }); });
                southParksAddon.registerActionHandler("item", function (input, ctx) { return __awaiter(void 0, void 0, void 0, function () {
                    var fetch, url, result, dataitem, data, send;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                fetch = ctx.fetch;
                                url = "https://www.southparkstudios.com" + input.ids.id;
                                return [4 /*yield*/, fetch(url).then(function (resp) { return __awaiter(void 0, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _a = parseId;
                                                return [4 /*yield*/, resp.text()];
                                            case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                                        }
                                    }); }); })];
                            case 1:
                                result = _a.sent();
                                dataitem = "https://media-utils.mtvnservices.com/services/MediaGenerator/mgid:arc:video:southpark.intl:" + result.link.toString() + "?arcStage=staging&accountOverride=intl.mtvi.com&billingSection=intl&ep=90877963&format=json&acceptMethods=hls&tveprovider=null";
                                return [4 /*yield*/, axios.get(dataitem)];
                            case 2:
                                data = (_a.sent()).data;
                                send = data.package.video.item[0].rendition[0].src;
                                return [2 /*return*/, {
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
                                    }];
                        }
                    });
                }); });
                sdk_1.runCli([southParksAddon], { singleMode: false });
                return [2 /*return*/];
        }
    });
}); })();
