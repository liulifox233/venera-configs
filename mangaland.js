class MangaLandSource extends ComicSource {
    name = "MangaLand";

    key = "mangaland";

    version = "1.0.0";

    minAppVersion = "1.4.0";

    url = "https://manga.meltyland.dev/";

    baseUrl = "https://manga.meltyland.dev";

    init() {
        this.baseUrl = "https://manga.meltyland.dev";
    }

    account = {
        login: async (account, pwd) => {
            let res = await Network.post(
                `${this.baseUrl}/api/auth/login`,
                {
                    "content-type": "application/json",
                },
                JSON.stringify({
                    email: account,
                    password: pwd,
                }),
            );

            if (res.status === 200) {
                let json = JSON.parse(res.body);
                this.saveData("token", json.token);
                return "ok";
            }

            throw "Failed to login";
        },
        logout: () => {
            this.deleteData("token");
            Network.deleteCookies(this.baseUrl);
        },

        registerWebsite: `${this.baseUrl}/register`,
    };

    search = {
        load: async (keyword, options, page) => {
            let res = await Network.get(
                `${this.baseUrl}/api/mangas?page=${page}&limit=20&search=${
                    encodeURIComponent(keyword)
                }`,
            );

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`;
            }

            let data = JSON.parse(res.body);
            let maxPage = Math.ceil(data.total / 20);

            function parseComic(comic) {
                return new Comic({
                    id: comic.id,
                    title: comic.title,
                    subTitle: comic.author || "",
                    cover: comic.cover || "",
                    description: comic.summary || "",
                });
            }

            return {
                comics: data.mangas.map(parseComic),
                maxPage: maxPage,
            };
        },
    };

    comic = {
        loadInfo: async (id) => {
            let res = await Network.get(`${this.baseUrl}/api/mangas/${id}`);

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`;
            }

            let data = JSON.parse(res.body);

            let chapters = {};
            (data.chapters || []).forEach((chapter) => {
                chapters[chapter.id.toString()] = (chapter.title || '');
            });

            return new ComicDetails({
                id: data.id.toString(),
                title: (data.title || ''),
                subTitle: data.author,
                cover: (data.cover || ''),
                tags: {
                    "标签": (data.tags || []),
                    "作者": [data.author],
                },
                description: (data.summary || ''),
                chapters: chapters
            });
        },
        loadEp: async (comicId, epId) => {
            let token = this.loadData("token");
            if (!token) {
                throw `Login required to read chapters`;
            }

            let res = await Network.get(
                `${this.baseUrl}/api/chapters/${epId}/pages?includeUrls=true`,
                {
                    "authorization": `Bearer ${token}`,
                },
            );

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`;
            }

            let data = JSON.parse(res.body);
            let images = data.pages.map((page) => page.imageUrl);

            return {
                images: images,
            };
        },
        enableTagsTranslate: false,
    };

    explore = [
        {
            title: "MangaLand",
            type: "singlePageWithMultiPart",
            load: async () => {
                let r = await Network.get(
                    `${this.baseUrl}/api/mangas?limit=20`,
                );

                const data = JSON.parse(r.body)

                console.log(data)

                const res = data.mangas.map((m) => {
                    return new Comic({
                        id: m.id,
                        title: m.title,
                        subTitle: m.author || "",
                        cover: m.cover,
                        tags: m.tags || [],
                        description: m.summary
                    })
                })

                let comic = {};
                comic["latest"] = res;
                return comic;
            }
        }
    ]

    settings = {
        serverUrl: {
            title: "Server URL",
            type: "input",
            default: "https://manga.meltyland.dev",
        },
    };
}
