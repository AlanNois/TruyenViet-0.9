// Common metadata interface for pagination
export interface GocTruyenTranhMetadata {
    page?: number;
}

// API Response Interfaces
export interface ChapterResponse {
    result: {
        chapters: {
            numberChapter: string;
            name: string;
            viewCount: number;
            stringUpdateTime: string;
        }[];
    };
}

export interface ChapterDetailResponse {
    result: {
        data: string[];
    };
}

export interface SearchResponse {
    result: {
        data?: MangaItem[];
        // For direct search results without data wrapper
        [key: string]: string | number | undefined | MangaItem[];
    };
}

export interface CategoryResponse {
    result: CategoryItem[];
}

// Data Structure Interfaces
export interface MangaItem {
    id: string;
    name: string;
    nameEn: string;
    photo: string;
    chapterLatest: string[];
}

export interface CategoryItem {
    id: string;
    name: string;
}

// Filter Interfaces
export interface FilterOptions {
    genres: CategoryItem[];
    status: CategoryItem[];
    sort: SortOption[];
}

export interface SortOption {
    id: string;
    name: string;
    value: string;
}

// Request Interfaces
export interface ChapterRequest {
    comicId: string;
    chapterNumber: string;
}

// Additional types for internal use
export type ViewMoreType = "hot" | "new_added" | "new_updated";

export interface HomeSectionData {
    id: ViewMoreType;
    title: string;
    view_more?: boolean;
}

// State management interface
export interface GocTruyenTranhStateManager {
    filters: Map<string, string>;
    setFilter(key: string, value: string): void;
    getFilter(key: string): string | undefined;
}

// Error types
export enum GocTruyenTranhErrorTypes {
    CLOUDFLARE_ERROR = "CLOUDFLARE_ERROR",
    PARSE_ERROR = "PARSE_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

// Authentication interface
export interface AuthConfig {
    token: string;
    expiry: number;
    refreshToken?: string;
}

// Response validation interfaces
export interface ValidationRule {
    field: string;
    type: "string" | "number" | "array" | "object";
    required: boolean;
}

export interface ValidatorResponse {
    isValid: boolean;
    errors?: string[];
}

// Constants interface
export interface GocTruyenTranhConstants {
    readonly DOMAIN: string;
    readonly API_DOMAIN: string;
    readonly DEFAULT_PAGE_SIZE: number;
    readonly MAX_RETRIES: number;
    readonly TIMEOUT: number;
}

// Rate limiting interface
export interface RateLimitConfig {
    requestsPerSecond: number;
    requestTimeout: number;
    maxRetries: number;
    retryDelay: number;
}
