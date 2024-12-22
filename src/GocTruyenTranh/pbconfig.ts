import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "GocTruyenTranh",
    description: "Content template extension",
    version: "1.0.0",
    icon: "icon.png",
    language: "vi",
    contentRating: ContentRating.EVERYONE,
    badges: [
        {
            label: "CloudFlare",
            textColor: "#FFFFFF",
            backgroundColor: "#F64B4B",
        },
        {
            label: "Recomemnd",
            textColor: "#FFFFFF",
            backgroundColor: "#03C04A",
        },
    ],
    capabilities: [
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.MANGA_CHAPTERS,
    ],
    developers: [
        {
            name: "AlanNois",
            website: "https://github.com/AlanNois",
            github: "https://github.com/AlanNois",
        },
    ],
} satisfies SourceInfo;
