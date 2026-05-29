Log.info("UIX mod loaded.");

const ItemRateBackend = require("backend/item-rate-backend");
const ItemRateFrontend = require("frontend/item-rate-frontend");
const PowerBackend = require("backend/power-backend");
const PowerToolBackend = require("backend/power-tool-backend");
const LiquidToolBackend = require("backend/liquid-tool-backend");
const PowerFrontend = require("frontend/power-frontend");
const HudToolPanel = require("frontend/hud-tool-panel");
const UixMenu = require("frontend/uix-menu");

ItemRateBackend.start();
ItemRateFrontend.start(ItemRateBackend);
PowerBackend.start();
PowerToolBackend.start();
LiquidToolBackend.start();
PowerFrontend.start(PowerBackend);
HudToolPanel.start();
UixMenu.start();
