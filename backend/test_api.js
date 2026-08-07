const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log("🚀 Starting API Tests...\n");

    // 1. Test /api/templates
    try {
        console.log("Testing GET /api/templates...");
        const res = await axios.get(`${BASE_URL}/api/templates`);
        if (Array.isArray(res.data) && res.data.length > 0) {
            console.log("✅ GET /api/templates passed. Templates found: " + res.data.length);
        } else {
            console.error("❌ GET /api/templates failed. Unexpected response:", res.data);
        }
    } catch (e) {
        console.error("❌ GET /api/templates failed:", e.message);
    }

    // 2. Test /api/import/url
    try {
        console.log("\nTesting POST /api/import/url...");
        const res = await axios.post(`${BASE_URL}/api/import/url`, { url: 'https://example.com' });
        if (res.data && res.data.extractedText) {
            console.log(`✅ POST /api/import/url passed. Word count: ${res.data.wordCount}`);
        } else {
            console.error("❌ POST /api/import/url failed. Unexpected response:", res.data);
        }
    } catch (e) {
        console.error("❌ POST /api/import/url failed:", e.message);
    }

    // 3. Test /api/media/image
    let mediaId = null;
    try {
        console.log("\nTesting POST /api/media/image...");
        const res = await axios.post(`${BASE_URL}/api/media/image`, { prompt: 'A test image' });
        if (res.data && res.data.url) {
            console.log(`✅ POST /api/media/image passed. URL: ${res.data.url}`);
            mediaId = res.data.id;
        } else {
            console.error("❌ POST /api/media/image failed. Unexpected response:", res.data);
        }
    } catch (e) {
        console.error("❌ POST /api/media/image failed:", e.message);
    }

    // 4. Test /api/media
    try {
        console.log("\nTesting GET /api/media...");
        const res = await axios.get(`${BASE_URL}/api/media`);
        if (Array.isArray(res.data)) {
            console.log(`✅ GET /api/media passed. Items found: ${res.data.length}`);
        } else {
            console.error("❌ GET /api/media failed. Unexpected response:", res.data);
        }
    } catch (e) {
        console.error("❌ GET /api/media failed:", e.message);
    }

    // 5. Test /api/generate-json with graphic contentType
    try {
        console.log("\nTesting POST /api/generate-json with contentType = 'graphic'...");
        const res = await axios.post(`${BASE_URL}/api/generate-json`, {
            prompt: 'A cool graphic',
            tone: 'Professional',
            contentType: 'graphic'
        });
        if (res.data && res.data.type === 'graphic') {
            console.log(`✅ POST /api/generate-json (graphic) passed. URL: ${res.data.url}`);
        } else {
            console.error("❌ POST /api/generate-json (graphic) failed. Unexpected response:", res.data);
        }
    } catch (e) {
        console.error("❌ POST /api/generate-json (graphic) failed:", e.message);
    }

    console.log("\n🎉 All tests completed!");
}

runTests();
