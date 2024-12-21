import { GocTruyenTranhConstants } from "./interfaces/GocTruyenTranhInterfaces";

// Base URLs and constants
export const GOCTRUYENTRANH_DOMAIN = "https://goctruyentranhvui7.com";
export const API_ENDPOINTS = {
    SEARCH: "/api/comic/search",
    COMIC: "/api/comic",
    CHAPTER: "/api/chapter/limitation",
    CATEGORY: "/api/category",
} as const;

// Authentication token
export const AUTH_TOKEN =
    "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJWxINuIEhvw6BuZyDEkGluaCIsImNvbWljSWRzIjpbXSwicm9sZUlkIjpudWxsLCJncm91cElkIjpudWxsLCJhZG1pbiI6ZmFsc2UsInJhbmsiOjAsInBlcm1pc3Npb24iOltdLCJpZCI6IjAwMDA1MjYzNzAiLCJ0ZWFtIjpmYWxzZSwiaWF0IjoxNzE1NDI0NDU3LCJlbWFpbCI6Im51bGwifQ.EjYw-HvoWM6RhbNzJkp06sSh61leaPcND0gb94PlDKeTYxfxU-f6WaxINAVjVYOP0pcVcG3YmfBVb4FVEBqPxQ";

// App constants
export const GOCTRUYENTRANH_CONSTANTS: GocTruyenTranhConstants = {
    DOMAIN: GOCTRUYENTRANH_DOMAIN,
    API_DOMAIN: GOCTRUYENTRANH_DOMAIN,
    DEFAULT_PAGE_SIZE: 20,
    MAX_RETRIES: 3,
    TIMEOUT: 30000,
} as const;

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
    requestsPerSecond: 4,
    requestTimeout: 50000,
    maxRetries: 3,
    retryDelay: 1000,
} as const;

// Home sections configuration
export const HOME_SECTIONS = {
    HOT: {
        id: "hot",
        title: "TRUYỆN HOT NHẤT",
    },
    NEW: {
        id: "new_added",
        title: "TRUYỆN MỚI",
    },
    UPDATED: {
        id: "new_updated",
        title: "TRUYỆN CẬP NHẬT GẦN ĐÂY",
    },
} as const;

// Default headers
export const DEFAULT_HEADERS = {
    referer: GOCTRUYENTRANH_DOMAIN,
    origin: GOCTRUYENTRANH_DOMAIN,
    "content-type": "application/x-www-form-urlencoded",
} as const;

// Error messages
export const ERROR_MESSAGES = {
    CLOUDFLARE_ERROR:
        "CLOUDFLARE BYPASS ERROR:\nPlease go to home page GocTruyenTranh source and press the cloud icon.",
    CHAPTER_NOT_FOUND: "No chapter data found!",
    MANGA_NOT_FOUND: "Manga not found!",
    NETWORK_ERROR: "Network error occurred!",
    INVALID_RESPONSE: "Invalid response from server!",
} as const;
