// functions/index.js
import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as PAAPI from "paapi5-nodejs-sdk";

// ---- Secrets (set via CLI below) ----
const PAAPI_ACCESS_KEY = defineSecret("PAAPI_ACCESS_KEY");
const PAAPI_SECRET_KEY = defineSecret("PAAPI_SECRET_KEY");
const PAAPI_PARTNER_TAG = defineSecret("PAAPI_PARTNER_TAG");

// Utilities
function pick(value, defaultValue = null) {
    return value !== undefined && value !== null ? value : defaultValue;
}

// Follow a.co and extract ASIN from many patterns
async function urlToAsin(input) {
    try {
        if (/^https?:\/\/a\.co\//i.test(input)) {
            const res = await fetch(input, {
                redirect: "follow",
                headers: { "user-agent": "Mozilla/5.0 (Emporium/1.0)" },
            });
            input = res.url || input;
        }

        const patterns = [
            /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
            /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
            /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i,
            /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
        ];
        for (const rx of patterns) {
            const m = input.match(rx);
            if (m) return m[1].toUpperCase();
        }

        // look inside querystring too (asin=..., or url=.../dp/ASIN)
        const u = new URL(input);
        for (const [k, v] of u.searchParams.entries()) {
            if (/^asin$/i.test(k) && /^[A-Z0-9]{10}$/i.test(v)) return v.toUpperCase();
            if (/^url$/i.test(k)) {
                const inner = decodeURIComponent(v);
                for (const rx of patterns) {
                    const m = inner.match(rx);
                    if (m) return m[1].toUpperCase();
                }
            }
        }
    } catch (e) {
        logger.warn("ASIN extraction failed:", e);
    }
    return null;
}

// ---- Callable: paapiFetch ----
export const paapiFetch = onCall(
    {
        region: "us-central1",
        secrets: [PAAPI_ACCESS_KEY, PAAPI_SECRET_KEY, PAAPI_PARTNER_TAG],
        cors: true,
    },
    async (req) => {
        const { url, asin: rawAsin } = req.data || {};
        if (!url && !rawAsin) {
            throw new Error("Provide url or asin");
        }

        const asin = rawAsin || (await urlToAsin(String(url)));
        if (!asin) {
            logger.info("No ASIN extracted", { url, rawAsin });
            return { error: "NO_ASIN", message: "Could not determine ASIN from the URL." };
        }

        // ---- Configure PA-API client properly ----
        const accessKey = PAAPI_ACCESS_KEY.value();
        const secretKey = PAAPI_SECRET_KEY.value();
        const partnerTag = PAAPI_PARTNER_TAG.value();

        const client = PAAPI.ApiClient.instance;
        client.accessKey = accessKey;
        client.secretKey = secretKey;

        // IMPORTANT: host for PA-API (NOT www.amazon.com)
        client.host = "webservices.amazon.com";
        // PA-API signing region for US marketplace is us-east-1
        client.region = "us-east-1";

        const api = new PAAPI.DefaultApi();
        const request = new PAAPI.GetItemsRequest();
        request.PartnerTag = partnerTag;
        request.PartnerType = "Associates";
        request.Marketplace = "www.amazon.com";
        request.ItemIds = [asin];
        request.Resources = [
            "Images.Primary.Large",
            "ItemInfo.Title",
            "ItemInfo.ByLineInfo",
            "ItemInfo.Features",
            "Offers.Listings.Price",
            "DetailPageURL",
        ];

        try {
            const resp = await api.getItems(request);
            const item = resp?.ItemsResult?.Items?.[0];

            // Return PA-API error payloads clearly
            if (!item) {
                const errs = resp?.Errors || resp?.ItemsResult?.Errors || [];
                logger.warn("PA-API returned no item", { asin, errs });
                return {
                    asin,
                    error: "NO_ITEM",
                    errors: errs,
                    message: pick(errs?.[0]?.Message, "No item returned for ASIN."),
                };
            }

            const payload = {
                asin,
                title: pick(item.ItemInfo?.Title?.DisplayValue),
                brand: pick(item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue),
                features: item.ItemInfo?.Features?.DisplayValues || [],
                imageUrl: item.Images?.Primary?.Large?.URL || "",
                detailPageURL: pick(item.DetailPageURL),
                priceDisplay: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "",
            };

            return payload;
        } catch (err) {
            // surface meaningful info to the client (your admin log prints it)
            logger.error("PA-API call failed", { asin, err });
            return { asin, error: "PAAPI_ERROR", message: String(err) };
        }
    }
);
