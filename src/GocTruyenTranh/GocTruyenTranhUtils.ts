import { CloudflareError } from "@paperback/types";
import { ERROR_MESSAGES, GOCTRUYENTRANH_DOMAIN } from "./GocTruyenTranhConfig";
import {
    GocTruyenTranhErrorTypes,
    ValidationRule,
    ValidatorResponse,
} from "./interfaces/GocTruyenTranhInterfaces";

export class GocTruyenTranhUtils {
    /**
     * Convert time string to Date object
     */
    static convertTime(timeAgo: string): Date {
        let time: Date;
        let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0]);
        trimmed = trimmed == 0 && timeAgo.includes("a") ? 1 : trimmed;

        if (timeAgo.includes("giây") || timeAgo.includes("secs")) {
            time = new Date(Date.now() - trimmed * 1000);
        } else if (timeAgo.includes("phút")) {
            time = new Date(Date.now() - trimmed * 60000);
        } else if (timeAgo.includes("giờ")) {
            time = new Date(Date.now() - trimmed * 3600000);
        } else if (timeAgo.includes("ngày")) {
            time = new Date(Date.now() - trimmed * 86400000);
        } else if (timeAgo.includes("tuần")) {
            time = new Date(Date.now() - trimmed * 86400000 * 7);
        } else if (timeAgo.includes("tháng")) {
            time = new Date(Date.now() - trimmed * 86400000 * 7 * 4);
        } else if (timeAgo.includes("năm")) {
            time = new Date(Date.now() - trimmed * 31556952000);
        } else {
            if (timeAgo.includes(":")) {
                const [H, D] = timeAgo.split(" ");
                const [month, day] = D.split("/");
                const finalD = `${month}/${day}/${new Date().getFullYear()}`;
                time = new Date(`${finalD} ${H}`);
            } else {
                const [day, month, year] = timeAgo.split("-");
                time = new Date(`${month}/${day}/${year}`);
            }
        }
        return time;
    }

    /**
     * Validate API response against schema
     */
    static validateResponse(
        response: Record<string, string | number | object>,
        rules: ValidationRule[],
    ): ValidatorResponse {
        const errors: string[] = [];

        for (const rule of rules) {
            const value = response[rule.field];

            if (rule.required && (value === undefined || value === null)) {
                errors.push(`Required field '${rule.field}' is missing`);
                continue;
            }

            if (value !== undefined && typeof value !== rule.type) {
                errors.push(
                    `Field '${rule.field}' should be of type ${rule.type}`,
                );
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Handle CloudFlare errors
     */
    static handleCloudFlareError(status: number, method: string): void {
        if (status === 503 || status === 403) {
            throw new CloudflareError({ url: GOCTRUYENTRANH_DOMAIN, method });
        }
    }

    /**
     * Clean and encode manga ID
     */
    static cleanMangaId(mangaId: string): string {
        const [nameEn, id] = mangaId.split("::");
        return `${encodeURIComponent(nameEn)}::${id}`;
    }

    /**
     * Extract chapter number from chapter ID
     */
    // static extractChapterNumber(chapterId: string): number {
    //     const match = chapterId.match(/\d+(\.\d+)?/);
    //     return match ? parseFloat(match[0]) : 0;
    // }

    /**
     * Decode HTML entities
     */
    static decodeHTMLEntity(str: string): string {
        const txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
    }

    /**
     * Generate a cache key for storing responses
     */
    // static generateCacheKey(type: string, id: string): string {
    //     return `goctruyentranh_${type}_${id}`;
    // }

    /**
     * Map error types to user-friendly messages
     */
    static getErrorMessage(error: GocTruyenTranhErrorTypes): string {
        switch (error) {
            case GocTruyenTranhErrorTypes.NETWORK_ERROR:
                return ERROR_MESSAGES.NETWORK_ERROR;
            case GocTruyenTranhErrorTypes.PARSE_ERROR:
                return ERROR_MESSAGES.INVALID_RESPONSE;
            case GocTruyenTranhErrorTypes.TIMEOUT_ERROR:
                return `Request timed out. Please try again.`;
            default:
                return "An unknown error occurred";
        }
    }

    /**
     * Build URL with query parameters
     */
    static buildUrl(baseUrl: string, params: Record<string, string>): string {
        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        return url.toString();
    }
}
