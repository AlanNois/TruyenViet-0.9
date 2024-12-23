import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    Cookie,
    CookieStorageInterceptor,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionType,
    PagedResults,
    Request,
    SearchQuery,
    SearchResultItem,
    SourceManga,
    TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import {
    API_ENDPOINTS,
    AUTH_TOKEN,
    GOCTRUYENTRANH_CONSTANTS as Constants,
    GocTruyenTranhImplamentation,
    HOME_SECTIONS,
    RATE_LIMIT_CONFIG,
} from "./GocTruyenTranhConfig";
import { GocTruyenTranhInterceptor } from "./GocTruyenTranhInterceptor";
import { GocTruyenTranhParser } from "./GocTruyenTranhParser";
import { GocTruyenTranhUtils as Utils } from "./GocTruyenTranhUtils";
import {
    CategoryResponse,
    ChapterDetailResponse,
    ChapterResponse,
    GocTruyenTranhMetadata,
    SearchResponse,
} from "./interfaces/GocTruyenTranhInterfaces";

export class GocTruyenTranh implements GocTruyenTranhImplamentation {
    private readonly parser = new GocTruyenTranhParser();

    globalRateLimiter = new BasicRateLimiter("ratelimiter", {
        numberOfRequests: RATE_LIMIT_CONFIG.numberOfRequests,
        bufferInterval: RATE_LIMIT_CONFIG.bufferInterval,
        ignoreImages: RATE_LIMIT_CONFIG.ignoreImages,
    });

    requestManager = new GocTruyenTranhInterceptor("main");
    cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });

    async initialise(): Promise<void> {
        this.globalRateLimiter.registerInterceptor();
        this.requestManager.registerInterceptor();
        if (Application.isResourceLimited) return;
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: HOME_SECTIONS.HOT.id,
                title: HOME_SECTIONS.HOT.title,
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: HOME_SECTIONS.NEW.id,
                title: HOME_SECTIONS.NEW.title,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: HOME_SECTIONS.UPDATED.id,
                title: HOME_SECTIONS.UPDATED.title,
                type: DiscoverSectionType.chapterUpdates,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: GocTruyenTranhMetadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 0;
        let url: string;
        let parser: (data: SearchResponse) => DiscoverSectionItem[];

        switch (section.id) {
            case HOME_SECTIONS.HOT.id:
                url = Utils.buildUrl(
                    `${Constants.DOMAIN}${API_ENDPOINTS.SEARCH}/view`,
                    { p: page.toString() },
                );
                parser = this.parser.parseHotSection.bind(this.parser);
                break;
            case HOME_SECTIONS.NEW.id:
                url = Utils.buildUrl(
                    `${Constants.DOMAIN}${API_ENDPOINTS.SEARCH}/new`,
                    { p: page.toString() },
                );
                parser = this.parser.parseNewSection.bind(this.parser);
                break;
            case HOME_SECTIONS.UPDATED.id:
                url = Utils.buildUrl(
                    `${Constants.DOMAIN}${API_ENDPOINTS.SEARCH}/recent`,
                    { p: page.toString() },
                );
                parser = this.parser.parseNewCSection.bind(this.parser);
                break;
            default:
                throw new Error(`Invalid section id: ${section.id}`);
        }

        const data = await this.getJSON<SearchResponse>(url);
        const items = parser.call(this.parser, data);

        return {
            items,
            metadata: { page: page + 1 },
        };
    }
    
    getMangaShareUrl(mangaId: string): string {
        return `${Constants.DOMAIN}/truyen/${mangaId.split("::")[0]}`;
    }

    async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
        for (const cookie of cookies) {
            if (
                cookie.name.startsWith("cf") ||
                cookie.name.startsWith("_cf") ||
                cookie.name.startsWith("__cf")
            ) {
                this.cookieStorageInterceptor.setCookie(cookie);
            }
        }
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const cleanId = Utils.cleanMangaId(mangaId);
        const url = `${Constants.DOMAIN}/truyen/${cleanId.split("::")[0]}`;
        const $ = await this.getHTML(url);
        return this.parser.parseMangaDetails($, mangaId);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const [, id] = sourceManga.mangaId.split("::");
        const url = `${Constants.DOMAIN}${API_ENDPOINTS.COMIC}/${id}/chapter?offset=0&limit=-1`;
        const data = await this.getJSON<ChapterResponse>(url);
        return this.parser.parseChapterList(data, sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const [, mangaNum] = chapter.sourceManga.mangaId.split("::");
        const chapNum = chapter.chapterId.split("-")[1];

        const response = await this.getJSON<ChapterDetailResponse>(
            `${Constants.DOMAIN}${API_ENDPOINTS.CHAPTER}`,
            {
                method: "POST",
                headers: {
                    authorization: AUTH_TOKEN,
                    "content-type": "application/x-www-form-urlencoded",
                },
                body: { comicId: `${mangaNum}&chapterNumber=${chapNum}` },
            },
        );

        const pages = this.parser.parseChapterDetails(response);

        return {
            mangaId: chapter.sourceManga.mangaId,
            id: chapter.chapterId,
            pages,
        };
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: GocTruyenTranhMetadata,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 0;

        // const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id === id)?.value;

        const genres = getFilterValue("genres") as Record<
            string,
            "included" | "excluded"
        >;
        const genreIncluded = Object.entries(genres)
            .filter(([, value]) => value === "included")
            .map(([key]) => key)
            .join(",");

        const searchUrl = query.title
            ? Utils.buildUrl(`${Constants.DOMAIN}${API_ENDPOINTS.SEARCH}`, {
                  name: query.title,
              })
            : Utils.buildUrl(
                  `${Constants.DOMAIN}${API_ENDPOINTS.SEARCH}/category`,
                  { p: page.toString(), value: genreIncluded[0] },
              );

        const response = await this.getJSON<SearchResponse>(searchUrl);
        const results = this.parser.parseSearch(response);

        return {
            items: results,
            metadata: query.title ? undefined : { page: page + 1 },
        };
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = `${Constants.DOMAIN}${API_ENDPOINTS.CATEGORY}`;
        const data = await this.getJSON<CategoryResponse>(url);
        return this.parser.parseTags(data);
    }

    private async getJSON<T>(
        url: string,
        options: Partial<Request> = {},
    ): Promise<T> {
        const request: Request = {
            url,
            method: options.method ?? "GET",
            headers: options.headers,
            body: options.body ?? {},
        };

        const [response, data] = await Application.scheduleRequest(request);
        Utils.handleCloudFlareError(response.status, request.method);
        return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
    }

    private async getHTML(url: string): Promise<CheerioAPI> {
        const request: Request = {
            url,
            method: "GET",
        };

        const [response, data] = await Application.scheduleRequest(request);
        Utils.handleCloudFlareError(response.status, request.method);
        return cheerio.load(Application.arrayBufferToUTF8String(data));
    }
}

export const GocTruyenTranhSource = new GocTruyenTranh();
