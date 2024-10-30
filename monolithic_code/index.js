const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const cors = require("cors");
const supplier = require("./app/controller/supplier.controller");
const app = express();
const mustacheExpress = require("mustache-express");
const favicon = require("serve-favicon");
const https = require("https");
// parse requests of content-type: application/json
app.use(bodyParser.json());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.options("*", cors());
app.engine("html", mustacheExpress());
app.set("view engine", "html");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use(favicon(__dirname + "/public/img/favicon.ico"));

const CACHE_EXPIRY = 21600 * 1000; // 6 hours in milliseconds
const metadataCache = {};

async function fetchToken() {
	if (metadataCache.token && Date.now() < metadataCache.tokenExpiry) {
		return metadataCache.token;
	}

	const response = await fetch("http://169.254.169.254/latest/api/token", {
		method: "PUT",
		headers: {
			"X-aws-ec2-metadata-token-ttl-seconds": "21600",
		},
	});

	const token = await response.text();
	metadataCache.token = token;
	metadataCache.tokenExpiry = Date.now() + CACHE_EXPIRY;
	return token;
}

// 주어진 메타데이터 경로에서 데이터를 가져오는 함수 (캐시 적용)
async function fetchMetadata(path, token) {
	// Check if metadata is cached and still valid
	if (metadataCache[path] && Date.now() < metadataCache[path].expiry) {
		return metadataCache[path].value;
	}

	try {
		const response = await fetch(`http://169.254.169.254/latest/meta-data/${path}`, {
			headers: {
				"X-aws-ec2-metadata-token": token,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch metadata: ${response.statusText}`);
		}

		const data = await response.text();
		// Cache metadata with expiry
		metadataCache[path] = { value: data, expiry: Date.now() + CACHE_EXPIRY };
		return data;
	} catch (error) {
		console.error("Error fetching metadata:", error.message);
		throw error;
	}
}

function fetchIpInfo() {
	if (metadataCache.ipInfo && Date.now() < metadataCache.ipInfo.expiry) {
		return Promise.resolve(metadataCache.ipInfo.value);
	}

	return new Promise((resolve, reject) => {
		const options = {
			path: "/json/",
			host: "ipapi.co",
			port: 443,
			headers: { "User-Agent": "nodejs-ipapi-v1.02" },
		};

		https
			.get(options, (resp) => {
				let body = "";
				resp.on("data", (data) => {
					body += data;
				});

				resp.on("end", () => {
					try {
						const loc = JSON.parse(body);
						const result = {
							ip: loc.ip,
							country: loc.country_name,
							region: loc.region,
							lat_long: `${loc.latitude}, ${loc.longitude}`,
							timezone: loc.timezone,
						};

						// Cache the IP information with expiry
						metadataCache.ipInfo = { value: result, expiry: Date.now() + CACHE_EXPIRY };
						resolve(result);
					} catch (error) {
						reject(error);
					}
				});
			})
			.on("error", (error) => {
				reject(error);
			});
	});
}
// list all the suppliers
app.get("/", async (req, res) => {
	try {
		const token = await fetchToken(); // 토큰 가져옴
		// 각 메타데이터 항목에 대한 요청을 비동기적으로 처리
		const [instance_id, instance_type, avail_zone] = await Promise.all([
			fetchMetadata("instance-id", token),
			fetchMetadata("instance-type", token),
			fetchMetadata("placement/availability-zone", token),
		]);

		const ipInfo = await fetchIpInfo();

		// 모든 메타데이터를 받은 후 응답을 렌더링
		res.render("home", {
			public_ip: ipInfo.ip,
			instance_id: instance_id,
			instance_type: instance_type,
			avail_zone: avail_zone,
			geo_country_name: ipInfo.country,
			geo_region_name: ipInfo.region,
			geo_lat_long: ipInfo.lat_long,
			geo_timezone: ipInfo.timezone,
		});
	} catch (error) {
		console.error("Error fetching EC2 metadata:", error);
		res.status(500).send("Internal Server Error");
	}
});

app.get("/health", (req, res) => {
	res.render("health", {});
});
app.get("/suppliers/", supplier.findAll);
// show the add suppler form
app.get("/supplier-add", (req, res) => {
	res.render("supplier-add", {});
});
// receive the add supplier POST
app.post("/supplier-add", supplier.create);
// show the update form
app.get("/supplier-update/:id", supplier.findOne);
// receive the update POST
app.post("/supplier-update", supplier.update);
// receive the POST to delete a supplier
app.post("/supplier-remove/:id", supplier.remove);
// handle 404
app.use(function (req, res, next) {
	res.status(404).render("404", {});
});

// set port, listen for requests
const app_port = process.env.APP_PORT || 80;
app.listen(app_port, () => {
	console.log(`Server is running on port ${app_port}.`);
});
