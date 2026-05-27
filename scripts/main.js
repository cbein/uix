Log.info("UIX mod loaded.");

const ItemRateBackend = require("backend/item-rate-backend");
const ItemRateFrontend = require("frontend/item-rate-frontend");
const PowerBackend = require("backend/power-backend");
const PowerFrontend = require("frontend/power-frontend");

ItemRateBackend.start();
ItemRateFrontend.start(ItemRateBackend);
PowerBackend.start();
PowerFrontend.start(PowerBackend);
