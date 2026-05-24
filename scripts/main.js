Log.info("UIX mod loaded.");

const ItemRateBackend = require("backend/item-rate-backend");
const ItemRateFrontend = require("frontend/item-rate-frontend");

ItemRateBackend.start();
ItemRateFrontend.start(ItemRateBackend);
