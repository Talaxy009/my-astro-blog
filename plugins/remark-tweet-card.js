import {visit} from 'unist-util-visit';

/** @type {Map<string, object|null>} */
const cache = new Map();

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com';

/**
 * Compute the token required by the Twitter syndication API.
 * @param {string} id
 * @returns {string}
 */
function getToken(id) {
    return ((Number(id) / 1e15) * Math.PI)
        .toString(36)
        .replace(/(0+|\.)/g, '');
}

/**
 * Validate and return a bare numeric tweet ID.
 * @param {string} input
 * @returns {string|null}
 */
function extractTweetId(input) {
    const id = input.trim();
    return /^\d+$/.test(id) ? id : null;
}

/**
 * Fetch tweet data from the Twitter syndication API.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function fetchTweetData(id) {
    if (cache.has(id)) return cache.get(id);

    const token = getToken(id);
    const url = `${SYNDICATION_URL}/tweet-result?id=${id}&lang=en&token=${encodeURIComponent(token)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RemarkTweetBot/1.0)',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            cache.set(id, null);
            return null;
        }

        const data = await response.json();

        // Syndication API may return an empty object for unavailable tweets
        if (!data || typeof data !== 'object' || !data.id_str) {
            cache.set(id, null);
            return null;
        }

        cache.set(id, data);
        return data;
    } catch {
        cache.set(id, null);
        return null;
    }
}

/**
 * Sanitize a URL to only allow http/https.
 * @param {string} url
 * @returns {string}
 */
function sanitizeUrl(url) {
    if (typeof url !== 'string') return '#';
    try {
        const u = new URL(url);
        if (u.protocol === 'https:' || u.protocol === 'http:') return url;
        return '#';
    } catch {
        return '#';
    }
}

/**
 * Escape HTML attribute values.
 * @param {unknown} str
 * @returns {string}
 */
function escapeAttr(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Format a numeric count with K/M abbreviations.
 * @param {number|undefined|null} n
 * @returns {string|null}
 */
function formatCount(n) {
    if (n === undefined || n === null) return null;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
}

/**
 * Format a tweet creation date.
 * @param {string} createdAt
 * @returns {string}
 */
function formatDate(createdAt) {
    try {
        const d = new Date(createdAt);
        const time = d.toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC',
        });
        const date = d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
        });
        return `${time} · ${date}`;
    } catch {
        return String(createdAt);
    }
}

/**
 * Process tweet text entities into HTML.
 * The Twitter syndication API returns text with HTML entities pre-encoded
 * (e.g. & → &amp;), so text segments are used as-is.
 * @param {object} tweet
 * @returns {string}
 */
function processBodyText(tweet) {
    const text = tweet.text || '';
    const [displayStart = 0, displayEnd = text.length] =
        tweet.display_text_range || [];
    const displayText = text.slice(displayStart, displayEnd);
    const entities = tweet.entities || {};

    /** @type {Array<{start: number, end: number, type: string, data: object}>} */
    const items = [];

    for (const url of entities.urls || []) {
        const s = url.indices[0] - displayStart;
        const e = url.indices[1] - displayStart;
        if (s >= 0 && e <= displayText.length) {
            items.push({start: s, end: e, type: 'url', data: url});
        }
    }

    for (const tag of entities.hashtags || []) {
        const s = tag.indices[0] - displayStart;
        const e = tag.indices[1] - displayStart;
        if (s >= 0 && e <= displayText.length) {
            items.push({start: s, end: e, type: 'hashtag', data: tag});
        }
    }

    for (const mention of entities.user_mentions || []) {
        const s = mention.indices[0] - displayStart;
        const e = mention.indices[1] - displayStart;
        if (s >= 0 && e <= displayText.length) {
            items.push({start: s, end: e, type: 'mention', data: mention});
        }
    }

    items.sort((a, b) => a.start - b.start);

    let html = '';
    let cursor = 0;

    for (const item of items) {
        if (item.start < cursor) continue;

        // Text segments from the API are already HTML-encoded
        html += displayText.slice(cursor, item.start);

        switch (item.type) {
            case 'url': {
                const href = escapeAttr(
                    sanitizeUrl(item.data.expanded_url || item.data.url),
                );
                const display = escapeAttr(
                    item.data.display_url || item.data.url,
                );
                html += `<a href="${href}" target="_blank" rel="noopener noreferrer" class="tweet-card-link">${display}</a>`;
                break;
            }
            case 'hashtag': {
                const tag = encodeURIComponent(item.data.text);
                html += `<a href="https://x.com/hashtag/${tag}" target="_blank" rel="noopener noreferrer" class="tweet-card-link">#${item.data.text}</a>`;
                break;
            }
            case 'mention': {
                const sn = encodeURIComponent(item.data.screen_name);
                html += `<a href="https://x.com/${sn}" target="_blank" rel="noopener noreferrer" class="tweet-card-link">@${item.data.screen_name}</a>`;
                break;
            }
        }

        cursor = item.end;
    }

    html += displayText.slice(cursor);
    return html;
}

/**
 * Build HTML for tweet media (photos / videos).
 * @param {object} tweet
 * @returns {string}
 */
function buildMediaHTML(tweet) {
    const media = tweet.mediaDetails || [];
    if (!media.length) return '';

    const videos = media.filter(
        (m) => m.type === 'video' || m.type === 'animated_gif',
    );
    const photos = media.filter((m) => m.type === 'photo');

    if (videos.length > 0) {
        const thumb = escapeAttr(videos[0].media_url_https);
        return `<div class="tweet-card-media"><div class="tweet-card-media-video"><img class="tweet-card-media-img" src="${thumb}" alt="Video" loading="lazy" /><div class="tweet-card-media-play">▶</div></div></div>`;
    }

    if (photos.length === 0) return '';

    if (photos.length === 1) {
        const src = escapeAttr(
            `${photos[0].media_url_https}?format=jpg&name=small`,
        );
        return `<div class="tweet-card-media"><div class="tweet-card-media-single"><img class="tweet-card-media-img" src="${src}" alt="Tweet image" loading="lazy" /></div></div>`;
    }

    const count = Math.min(photos.length, 4);
    const gridClass = `tweet-card-media-grid tweet-card-media-grid-${count}`;
    const imgs = photos
        .slice(0, count)
        .map((p) => {
            const src = escapeAttr(
                `${p.media_url_https}?format=jpg&name=small`,
            );
            return `<img class="tweet-card-media-img" src="${src}" alt="Tweet image" loading="lazy" />`;
        })
        .join('');

    return `<div class="tweet-card-media"><div class="${gridClass}">${imgs}</div></div>`;
}

/**
 * Build HTML for a quoted tweet.
 * @param {object} qt
 * @returns {string}
 */
function buildQuotedTweetHTML(qt) {
    if (!qt?.user) return '';

    const qtUrl = escapeAttr(
        `https://x.com/${qt.user.screen_name}/status/${qt.id_str}`,
    );
    const qtAvatar = escapeAttr(qt.user.profile_image_url_https || '');
    const qtName = escapeAttr(qt.user.name);
    const qtHandle = qt.user.screen_name;
    const qtText = qt.text
        ? qt.text.slice(...(qt.display_text_range || [0, qt.text.length]))
        : '';

    return `<a href="${qtUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card-quoted"><div class="tweet-card-quoted-header"><img src="${qtAvatar}" alt="${qtName}" class="tweet-card-quoted-avatar" loading="lazy" /><span class="tweet-card-quoted-author-name">${qtName}</span><span class="tweet-card-quoted-author-handle">@${qtHandle}</span></div><p class="tweet-card-quoted-body">${qtText}</p></a>`;
}

// SVG icons

const X_LOGO_SVG = `<svg class="tweet-card-x-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

const VERIFIED_SVG = `<svg class="tweet-card-verified" viewBox="0 0 24 24" aria-label="Verified account"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>`;

const INFO_ICON_SVG = `<svg class="tweet-card-info-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 8.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S11.17 7 12 7s1.5.67 1.5 1.5zM13 17v-5h-2v5h2zm-1 5.25c5.66 0 10.25-4.59 10.25-10.25S17.66 1.75 12 1.75 1.75 6.34 1.75 12 6.34 22.25 12 22.25zM20.25 12c0 4.56-3.69 8.25-8.25 8.25S3.75 16.56 3.75 12 7.44 3.75 12 3.75s8.25 3.69 8.25 8.25z"/></svg>`;

/**
 * Build the full tweet card HTML.
 * @param {object} tweet
 * @param {string} originalUrl
 * @returns {string}
 */
function buildTweetHTML(tweet, originalUrl) {
    const tweetUrl = `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
    const avatarUrl = escapeAttr(tweet.user.profile_image_url_https || '');
    const verified = tweet.user.is_blue_verified || tweet.user.verified;
    const name = escapeAttr(tweet.user.name);
    const screenName = tweet.user.screen_name;

    const bodyHtml = processBodyText(tweet);
    const mediaHtml = buildMediaHTML(tweet);
    const quotedHtml = tweet.quoted_tweet
        ? buildQuotedTweetHTML(tweet.quoted_tweet)
        : '';

    const replyToHtml = tweet.in_reply_to_screen_name
        ? `<div class="tweet-card-reply">Replying to <a href="https://x.com/${encodeURIComponent(tweet.in_reply_to_screen_name)}" target="_blank" rel="noopener noreferrer" class="tweet-card-link">@${tweet.in_reply_to_screen_name}</a></div>`
        : '';

    const dateStr = escapeAttr(formatDate(tweet.created_at));
    const safeTweetUrl = escapeAttr(sanitizeUrl(tweetUrl));

    const likeCount = formatCount(tweet.favorite_count);
    const retweetCount = formatCount(tweet.retweet_count);

    const statsHtml = [
        likeCount !== null
            ? `<span class="tweet-card-action-stat"><span class="tweet-card-stat-count">${likeCount}</span> Likes</span>`
            : '',
        retweetCount !== null
            ? `<span class="tweet-card-action-stat"><span class="tweet-card-stat-count">${retweetCount}</span> Reposts</span>`
            : '',
    ]
        .filter(Boolean)
        .join('');

    return `<div class="tweet-card"><article class="tweet-card-article"><div class="tweet-card-header"><a href="https://x.com/${encodeURIComponent(screenName)}" target="_blank" rel="noopener noreferrer" class="tweet-card-avatar-link"><img src="${avatarUrl}" alt="${name}" class="tweet-card-avatar" loading="lazy" /></a><div class="tweet-card-author"><div class="tweet-card-author-row"><span class="tweet-card-author-name">${name}</span>${verified ? VERIFIED_SVG : ''}</div><div class="tweet-card-author-handle">@${screenName}</div></div><a href="${safeTweetUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card-x-link" aria-label="View on X">${X_LOGO_SVG}</a></div>${replyToHtml}<p class="tweet-card-body">${bodyHtml}</p>${mediaHtml}${quotedHtml}<div class="tweet-card-info"><a href="${safeTweetUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card-date">${dateStr}</a><a href="https://help.x.com/en/x-for-websites-ads-info-and-privacy" target="_blank" rel="noopener noreferrer" class="tweet-card-privacy-link" aria-label="X for Websites: Ads info and privacy">${INFO_ICON_SVG}</a></div><div class="tweet-card-actions">${statsHtml}<a href="${safeTweetUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card-view-btn">View on X</a></div></article></div>`.trim();
}

/**
 * Build a fallback HTML element when the tweet cannot be fetched.
 * @param {string} originalUrl
 * @returns {string}
 */
function buildErrorHTML(originalUrl) {
    const safeUrl = escapeAttr(sanitizeUrl(originalUrl));
    return `<div class="tweet-card"><article class="tweet-card-article tweet-card-not-found"><p class="tweet-card-not-found-text">Tweet not available.</p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card-link">View on X →</a></article></div>`.trim();
}

/**
 * Remark plugin that transforms [$tweet](url) paragraphs into tweet card HTML.
 */
export default function remarkTweetCard() {
    return async function (tree) {
        /** @type {Array<{node: object, index: number, parent: object, url: string}>} */
        const targets = [];

        visit(tree, 'paragraph', (node, index, parent) => {
            if (node.children.length !== 1) return;
            const child = node.children[0];
            if (
                child.type === 'link' &&
                child.children.length === 1 &&
                child.children[0].type === 'text' &&
                child.children[0].value === '$tweet'
            ) {
                targets.push({node, index, parent, url: child.url});
            }
        });

        if (targets.length === 0) return;

        const results = await Promise.all(
            targets.map(async ({url}) => {
                const id = extractTweetId(url);
                if (!id) return {tweet: null, url};
                const tweet = await fetchTweetData(id);
                const tweetUrl = `https://x.com/i/web/status/${id}`;
                return {tweet, url: tweetUrl};
            }),
        );

        for (let i = 0; i < targets.length; i++) {
            const {index, parent} = targets[i];
            const {tweet, url} = results[i];
            parent.children[index] = {
                type: 'html',
                value: tweet
                    ? buildTweetHTML(tweet, url)
                    : buildErrorHTML(url),
            };
        }
    };
}
