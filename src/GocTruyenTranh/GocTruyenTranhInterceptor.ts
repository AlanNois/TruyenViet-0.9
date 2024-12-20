import { PaperbackInterceptor, Request, Response } from "@paperback/types";
import { GC_DOMAIN } from "./GocTruyenTranhConfig";

// Intercepts all the requests and responses and allows you to make changes to them
export class GocTruyenTranhInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...(request.headers ?? {}),
            ...{
                referer: GC_DOMAIN,
                "user-agent": await Application.getDefaultUserAgent(),
            },
        };
        return request;
    }

    override async interceptResponse(
        request: Request,
        response: Response,
        data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
        return data;
    }
}
