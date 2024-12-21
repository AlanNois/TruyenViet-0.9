import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    CloudflareBypassRequestProviding,
    CloudflareError,
    ContentRating,
    Cookie,
    CookieStorageInterceptor,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    Extension,
    // Form,
    MangaProviding,
    PagedResults,
    // PaperbackInterceptor,
    // Request,
    // Response,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    // SettingsFormProviding,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
// import { setFilters } from "./GocTruyenTranhUtils";
// import {
//     Filters,
//     GocTruyenTranhMetadata,
// } from "./interfaces/GocTruyenTranhInterfaces";

import content from "../../content.json";
import { GOCTRUYENTRANH_DOMAIN } from "./GocTruyenTranhConfig";
// import { GC_API_DOMAIN, GC_DOMAIN } from "./GocTruyenTranhConfig";
import { GocTruyenTranhInterceptor } from "./GocTruyenTranhInterceptor";

// Should match the capabilities which you defined in pbconfig.ts
type GocTruyenTranhImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    DiscoverSectionProviding &
    CloudflareBypassRequestProviding;

// Main extension class
export class GocTruyenTranhExtension implements GocTruyenTranhImplementation {
    // Implementation of the main rate limiter
    globalRateLimiter = new BasicRateLimiter("ratelimiter", {
        numberOfRequests: 5,
        bufferInterval: 1,
        ignoreImages: true,
    });

    // Implementation of the main interceptor
    mainInterceptor = new GocTruyenTranhInterceptor("main");
    cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });

    // Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
    async initialise(): Promise<void> {
        this.globalRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
        this.cookieStorageInterceptor.registerInterceptor();

        if (Application.isResourceLimited) return;
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "genre",
                title: "THỂ LOẠI",
                type: DiscoverSectionType.genres,
            },
            {
                id: "hot",
                title: "TRUYỆN HOT",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "new",
                title: "TRUYỆN MỚI",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "latest",
                title: "TRUYỆN MỚI CẬP NHẬT",
                type: DiscoverSectionType.chapterUpdates,
            },
        ];
    }

    // Populates both the discover sections
    async getDiscoverSectionItems(
        section: DiscoverSection,
        // metadata: GocTruyenTranhMetadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        // let items: DiscoverSectionItem[] = [];
        // const page = metadata?.page ?? 1;

        let i: number;
        let type: string;
        switch (section.id) {
            case "hot":
                i = 0;
                type = "prominentCarouselItem";
                break;
            case "new":
                i = 5;
                type = "simpleCarouselItem";
                break;
        }

        return {
            items: Array.from(Array(content.length / 2)).map(() => {
                const result = {
                    mangaId: content[i].titleId,
                    title: content[i].primaryTitle
                        ? content[i].primaryTitle
                        : "Unknown Title",
                    subtitle: content[i].secondaryTitles[0],
                    imageUrl: content[i].thumbnailUrl
                        ? content[i].thumbnailUrl
                        : "",
                    type: type,
                } as DiscoverSectionItem;
                ++i;
                return result;
            }),
        };
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

    // Populates search
    async getSearchResults(
        query: SearchQuery,
        metadata?: number,
    ): Promise<PagedResults<SearchResultItem>> {
        void metadata;

        const results: PagedResults<SearchResultItem> = { items: [] };

        for (let i = 0; i < content.length; i++) {
            if (
                (content[i].primaryTitle
                    .toLowerCase()
                    .indexOf(query.title.toLowerCase()) != -1 &&
                    query.filters[0].value == "include") ||
                (content[i].primaryTitle
                    .toLowerCase()
                    .indexOf(query.title.toLowerCase()) == -1 &&
                    query.filters[0].value == "exclude")
            ) {
                if (content[i].titleId) {
                    const result: SearchResultItem = {
                        mangaId: content[i].titleId,
                        title: content[i].primaryTitle
                            ? content[i].primaryTitle
                            : "Unknown Title",
                        subtitle: content[i].secondaryTitles[0],
                        imageUrl: content[i].thumbnailUrl
                            ? content[i].thumbnailUrl
                            : "",
                    };
                    results.items.push(result);
                }
            } else {
                for (let j = 0; j < content[i].secondaryTitles.length; j++) {
                    if (
                        (content[i].secondaryTitles[j]
                            .toLowerCase()
                            .indexOf(query.title.toLowerCase()) != -1 &&
                            query.filters[0].value == "include") ||
                        (content[i].secondaryTitles[j]
                            .toLowerCase()
                            .indexOf(query.title.toLowerCase()) == -1 &&
                            query.filters[0].value == "exclude")
                    ) {
                        if (content[i].titleId) {
                            const result: SearchResultItem = {
                                mangaId: content[i].titleId,
                                title: content[i].primaryTitle
                                    ? content[i].primaryTitle
                                    : "Unknown Title",
                                subtitle: content[i].secondaryTitles[0],
                                imageUrl: content[i].thumbnailUrl
                                    ? content[i].thumbnailUrl
                                    : "",
                            };
                            results.items.push(result);
                        }
                        break;
                    }
                }
            }
        }
        return results;
    }

    // Populates the title details
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        for (let i = 0; i < content.length; i++) {
            if (mangaId == content[i].titleId) {
                let contentRating: ContentRating;
                switch (content[i].contentRating) {
                    case "EVERYONE":
                        contentRating = ContentRating.EVERYONE;
                        break;
                    case "MATURE":
                        contentRating = ContentRating.MATURE;
                        break;
                    case "ADULT":
                        contentRating = ContentRating.ADULT;
                        break;
                    default:
                        contentRating = ContentRating.EVERYONE;
                        break;
                }

                const genres: TagSection = {
                    id: "genres",
                    title: "Genres",
                    tags: [],
                };
                for (let j = 0; j < content[i].genres.length; j++) {
                    const genre: Tag = {
                        id: content[i].genres[j]
                            .toLowerCase()
                            .replace(" ", "-"),
                        title: content[i].genres[j],
                    };
                    genres.tags.push(genre);
                }

                const tags: TagSection = {
                    id: "tags",
                    title: "Tags",
                    tags: [],
                };
                for (let j = 0; j < content[i].tags.length; j++) {
                    const tag: Tag = {
                        id: content[i].tags[j].toLowerCase().replace(" ", "-"),
                        title: content[i].tags[j],
                    };
                    tags.tags.push(tag);
                }

                return {
                    mangaId,
                    mangaInfo: {
                        thumbnailUrl: content[i].thumbnailUrl
                            ? content[i].thumbnailUrl
                            : "",
                        synopsis: content[i].synopsis
                            ? content[i].synopsis
                            : "No synopsis.",
                        primaryTitle: content[i].primaryTitle
                            ? content[i].primaryTitle
                            : "Unknown Title",
                        secondaryTitles: content[i].secondaryTitles
                            ? content[i].secondaryTitles
                            : [],
                        contentRating,
                        status: content[i].status,
                        author: content[i].author,
                        rating: content[i].rating,
                        tagGroups: [genres, tags],
                        artworkUrls: [content[i].thumbnailUrl],
                    },
                };
            }
        }
        throw new Error("No title with this id exists");
    }

    // Populates the chapter list
    async getChapters(
        sourceManga: SourceManga,
        sinceDate?: Date,
    ): Promise<Chapter[]> {
        // Can be used to only return new chapters. Not used here, instead the whole chapter list gets returned
        void sinceDate;

        for (let i = 0; i < content.length; i++) {
            if (sourceManga.mangaId == content[i].titleId) {
                const chapters: Chapter[] = [];

                for (let j = 0; j < content[i].chapters.length; j++) {
                    if (content[i].chapters[j].chapterId) {
                        const chapter: Chapter = {
                            chapterId: content[i].chapters[j].chapterId,
                            sourceManga,
                            langCode: content[i].chapters[j].languageCode
                                ? content[i].chapters[j].languageCode
                                : "EN",
                            chapNum: content[i].chapters[j].chapterNumber
                                ? content[i].chapters[j].chapterNumber
                                : j + 1,
                            title: content[i].primaryTitle,
                            volume: content[i].chapters[j].volumeNumber,
                        };
                        chapters.push(chapter);
                    }
                }
                return chapters;
            }
        }
        throw new Error("No title with this id exists");
    }

    // Populates a chapter with images
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        for (let i = 0; i < content.length; i++) {
            if (chapter.sourceManga.mangaId == content[i].titleId) {
                for (let j = 0; j < content[i].chapters.length; j++) {
                    if (chapter.chapterId == content[i].chapters[j].chapterId) {
                        const chapterDetails: ChapterDetails = {
                            id: chapter.chapterId,
                            mangaId: chapter.sourceManga.mangaId,
                            pages: content[i].chapters[j].pages,
                        };
                        return chapterDetails;
                    }
                }
                throw new Error("No chapter with this id exists");
            }
        }
        throw new Error("No title with this id exists");
    }

    checkCloudflareStatus(status: number): void {
        if (status == 503 || status == 403) {
            throw new CloudflareError({
                url: GOCTRUYENTRANH_DOMAIN,
                method: "GET",
            });
        }
    }
}

export const GocTruyenTranh = new GocTruyenTranhExtension();
