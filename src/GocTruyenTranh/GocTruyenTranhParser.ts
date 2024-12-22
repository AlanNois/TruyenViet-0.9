import {
    Chapter,
    ContentRating,
    DiscoverSectionItem,
    SearchResultItem,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
import { CheerioAPI } from "cheerio";
import { GOCTRUYENTRANH_DOMAIN } from "./GocTruyenTranhConfig";
import { GocTruyenTranhUtils as Utils } from "./GocTruyenTranhUtils";
import {
    CategoryResponse,
    ChapterDetailResponse,
    ChapterResponse,
    SearchResponse,
} from "./interfaces/GocTruyenTranhInterfaces";

export class GocTruyenTranhParser {
    parseMangaDetails($: CheerioAPI, mangaId: string): SourceManga {
        const titles = [
            Utils.decodeHTMLEntity($(".v-card-title").text().trim()),
        ];
        let author = "",
            artist = "",
            status = "";

        $(".information-section > div").each((_, obj) => {
            const label = $(obj).text().trim().split("\n")[0];
            const value = $(obj).text().split("\n")[1]?.trim() ?? "";

            switch (label) {
                case "Tác giả:":
                    author = artist = value;
                    break;
                case "Trạng thái:":
                    status = value;
                    break;
            }
        });

        const image = this.processImageUrl($(".v-image > img").attr("src"));
        const desc = Utils.decodeHTMLEntity(
            $(
                ".v-card-text.pt-1.px-4.pb-4.text-secondary.font-weight-medium",
            ).text(),
        );
        const rating = parseFloat($(".pr-3 > b").text().trim());

        const tags: Tag[] = [];
        $(".group-content a").each((_, obj) => {
            const label = $("span:nth-child(2)", obj).text().trim();
            const id = $(obj).attr("href")?.trim().split("=")[1] ?? label;
            tags.push({ id: `genres:${id}`, title: label });
        });

        const tagSections: TagSection[] = [
            { id: "0", title: "genres", tags: tags },
        ];

        return {
            mangaId,
            mangaInfo: {
                primaryTitle: titles[0],
                secondaryTitles: titles.slice(1),
                thumbnailUrl: image,
                synopsis: desc,
                author,
                artist,
                status,
                rating,
                contentRating: ContentRating.EVERYONE,
                tagGroups: tagSections,
            },
        };
    }

    parseChapterList(
        data: ChapterResponse,
        sourceManga: SourceManga,
    ): Chapter[] {
        const chapters: Chapter[] = [];

        for (const obj of data.result.chapters) {
            const chapNum = parseFloat(obj.numberChapter);
            const id = `chuong-${chapNum}`;
            const time = Utils.convertTime(obj.stringUpdateTime);
            const name = obj.name !== "N/A" ? obj.name : "";
            const group = `${obj.viewCount} lượt xem`;

            chapters.push({
                chapterId: id,
                title: `Chương ${name ?? chapNum}`,
                chapNum,
                langCode: "🇻🇳",
                publishDate: time,
                metadata: group,
                sourceManga,
            });
        }

        return chapters;
    }

    parseChapterDetails(json: ChapterDetailResponse): string[] {
        const pages: string[] = [];

        if (!json?.result?.data) {
            throw new Error("Invalid chapter data format");
        }

        for (const img of json.result.data) {
            pages.push(this.processImageUrl(img));
        }

        return pages;
    }

    parseSearch(data: SearchResponse): SearchResultItem[] {
        const items: SearchResultItem[] = [];
        const collectedIds: string[] = [];

        const mangaItems = data.result.data ?? [];

        for (const obj of mangaItems) {
            const mangaId = `${obj.nameEn}::${obj.id}`;

            if (!collectedIds.includes(mangaId)) {
                items.push({
                    mangaId,
                    imageUrl: this.processImageUrl(obj.photo),
                    title: Utils.decodeHTMLEntity(obj.name),
                    subtitle: obj.chapterLatest[0]
                        ? `Chapter ${obj.chapterLatest[0]}`
                        : "",
                });
                collectedIds.push(mangaId);
            }
        }

        return items;
    }

    parseNewSection(data: SearchResponse): DiscoverSectionItem[] {
        const items: DiscoverSectionItem[] = [];
        const collectedIds: string[] = [];

        const mangaItems = data.result.data ?? [];

        for (const obj of mangaItems) {
            const mangaId = `${obj.nameEn}::${obj.id}`;

            if (!collectedIds.includes(mangaId)) {
                items.push({
                    mangaId,
                    imageUrl: this.processImageUrl(obj.photo),
                    title: Utils.decodeHTMLEntity(obj.name),
                    subtitle: obj.chapterLatest[0]
                        ? `Chapter ${obj.chapterLatest[0]}`
                        : "",
                    type: "simpleCarouselItem",
                });
                collectedIds.push(mangaId);
            }
        }

        return items;
    }

    parseNewCSection(data: SearchResponse): DiscoverSectionItem[] {
        const items: DiscoverSectionItem[] = [];
        const collectedIds: string[] = [];

        const mangaItems = data.result.data ?? [];

        for (const obj of mangaItems) {
            const mangaId = `${obj.nameEn}::${obj.id}`;

            if (!collectedIds.includes(mangaId)) {
                items.push({
                    mangaId,
                    chapterId: `chuong-${obj.chapterLatest[0]}`,
                    imageUrl: this.processImageUrl(obj.photo),
                    title: Utils.decodeHTMLEntity(obj.name),
                    subtitle: obj.chapterLatest[0]
                        ? `Chapter ${obj.chapterLatest[0]}`
                        : "",
                    type: "chapterUpdatesCarouselItem",
                });
                collectedIds.push(mangaId);
            }
        }

        return items;
    }

    parseHotSection(data: SearchResponse): DiscoverSectionItem[] {
        const items: DiscoverSectionItem[] = [];
        const collectedIds: string[] = [];

        const mangaItems = data.result.data ?? [];

        for (const obj of mangaItems) {
            const mangaId = `${obj.nameEn}::${obj.id}`;

            if (!collectedIds.includes(mangaId)) {
                items.push({
                    mangaId,
                    imageUrl: this.processImageUrl(obj.photo),
                    title: Utils.decodeHTMLEntity(obj.name),
                    subtitle: obj.chapterLatest[0]
                        ? `Chapter ${obj.chapterLatest[0]}`
                        : "",
                    type: "prominentCarouselItem",
                });
                collectedIds.push(mangaId);
            }
        }

        return items;
    }

    parseTags(data: CategoryResponse): TagSection[] {
        const tags: Tag[] = data.result.map((cat) => ({
            id: `category:${cat.id}`,
            title: cat.name,
        }));

        return [
            {
                id: "0",
                title: "Thể loại",
                tags,
            },
        ];
    }

    private processImageUrl(url: string | undefined): string {
        if (!url) return "";
        return url.indexOf("https") === -1
            ? `${GOCTRUYENTRANH_DOMAIN}${url}`
            : url;
    }
}
